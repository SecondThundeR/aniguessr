import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  AnimeScreenshotsDataSchema,
  AnimeScreenshotsSchema,
} from "@/schemas/animeScreenshots";
import {
  type Animes,
  AnimesNonScreenshotSchema,
  AnimesSchema,
} from "@/schemas/animes";
import { type DBAnimeArray, DBAnimeArraySchema } from "@/schemas/db/animes";
import { DBAnswerArraySchema } from "@/schemas/db/answers";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { prisma } from "@/server/db";
import { buildExcludeParams } from "@/utils/query/createGame/buildExcludeParams";
import { getSelectedIDs } from "@/utils/query/createGame/getSelectedIDs";
import { buildDecoyParams } from "@/utils/query/getGameData/buildDecoyParams";
import { buildScreenshotsParams } from "@/utils/query/getGameData/buildScreenshotsParams";
import { isNotEmpty } from "@/utils/string/isNotEmpty";

const SHIKIMORI_GRAPHQL_API_URL = new URL("https://shikimori.me/api/graphql");

export const gameRouter = createTRPCRouter({
  createGame: protectedProcedure
    .input(z.object({ amount: z.number().min(5).max(50) }))
    .mutation(async ({ ctx, input }) => {
      const selectedAnimes: Animes = [];

      try {
        do {
          const res = await fetch(
            SHIKIMORI_GRAPHQL_API_URL,
            buildExcludeParams(getSelectedIDs(selectedAnimes)),
          );
          const parsedAnimes = (await AnimesSchema.parseAsync(await res.json()))
            .data.animes;

          const filteredAnimes = parsedAnimes.filter(
            (data) => data.screenshots.length > 0 && isNotEmpty(data.russian),
          );
          selectedAnimes.push(
            ...filteredAnimes.slice(0, input.amount - selectedAnimes.length),
          );
        } while (selectedAnimes.length < input.amount);

        const gameAnimes = selectedAnimes.map((anime) => {
          const { id, russian } = anime;

          return {
            id,
            name: russian,
          };
        });

        const gameData = await prisma.game.create({
          data: {
            amount: input.amount,
            animes: JSON.stringify(gameAnimes),
            userId: ctx.session.user.id,
          },
        });
        return gameData.id;
      } catch (e: unknown) {
        if (e instanceof z.ZodError) {
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: "Can't process response from Shikimori API",
            cause: e,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something bad happened while creating a game",
          cause: e,
        });
      }
    }),

  getGameInfo: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .query(async ({ input }) => {
      const gameInfo = await prisma.game.findUnique({
        where: {
          id: input.gameId,
        },
      });
      if (gameInfo === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can't find game with requested ID",
        });

      return gameInfo;
    }),

  getGameData: protectedProcedure
    .input(
      z.object({
        animeIds: z.string(),
      }),
    )
    .output(
      z.object({
        screenshots: z.array(AnimeScreenshotsDataSchema),
        decoys: DBAnimeArraySchema,
      }),
    )
    .query(async ({ input }) => {
      const decoyAnimes: DBAnimeArray = [];

      try {
        const screenshotsRes = await fetch(
          SHIKIMORI_GRAPHQL_API_URL,
          buildScreenshotsParams(input.animeIds),
        );
        const parsedScreenshots = (
          await AnimeScreenshotsSchema.parseAsync(await screenshotsRes.json())
        ).data.animes.map((anime) => {
          return {
            id: anime.id,
            screenshots: anime.screenshots.slice(0, 6),
          };
        });

        do {
          const decoyRes = await fetch(
            SHIKIMORI_GRAPHQL_API_URL,
            buildDecoyParams(input.animeIds),
          );
          const parsedDecoy = (
            await AnimesNonScreenshotSchema.parseAsync(await decoyRes.json())
          ).data.animes
            .filter((anime) => isNotEmpty(anime.russian))
            .map((anime) => {
              const { id, russian } = anime;
              return { id, name: russian };
            });
          decoyAnimes.push(
            ...parsedDecoy.slice(0, parsedScreenshots.length * 3),
          );
        } while (decoyAnimes.length < parsedScreenshots.length * 3);

        console.log(parsedScreenshots);
        return { screenshots: parsedScreenshots, decoys: decoyAnimes };
      } catch (e: unknown) {
        if (e instanceof z.ZodError) {
          console.info(e);
          throw new TRPCError({
            code: "UNPROCESSABLE_CONTENT",
            message: "Can't process response from Shikimori API",
            cause: e,
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Something bad happened while creating a game",
          cause: e,
        });
      }
    }),

  updateAnswers: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        answers: DBAnswerArraySchema,
        isFinished: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await prisma.game.update({
        where: {
          id: input.gameId,
        },
        data: {
          answers: JSON.stringify(input.answers),
          currentAnimeIndex: input.answers.length,
          isFinished: input.isFinished,
        },
      });
    }),

  deleteGame: protectedProcedure
    .input(z.object({ gameId: z.string() }))
    .mutation(async ({ input }) => {
      await prisma.game.delete({
        where: {
          id: input.gameId,
        },
      });
    }),
});
