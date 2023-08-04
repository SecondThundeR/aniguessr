import { createServerSideHelpers } from "@trpc/react-query/server";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import Head from "next/head";
import { memo } from "react";
import superjson from "superjson";

import { ResultAnswers } from "@/components/ResultAnswers";
import { ResultHeader } from "@/components/ResultHeader";
import { URLCopyButton } from "@/components/URLCopyButton";
import { Divider } from "@/components/ui/Divider";
import { Title } from "@/components/ui/Title";

import { PageLayout } from "@/layouts/PageLayout";

import { DBAnimeArraySchema } from "@/schemas/db/animes";
import { DBAnswerArraySchema } from "@/schemas/db/answers";

import { appRouter } from "@/server/api/root";
import { getServerAuthSession } from "@/server/auth";
import { prisma } from "@/server/db";

import { getCorrectAnswersAmount } from "@/utils/game/getCorrectAnswersAmount";
import { isInvalidQuery } from "@/utils/server/isInvalidQuery";

const ResultsPage = memo(function ResultsPage({
  user,
  playerData: { userName, id },
  gameData: { amount, animes, answers },
  host,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const playerTitleName = userName ?? "анонима";
  const correctAnswersAmount = getCorrectAnswersAmount(amount, answers);

  return (
    <>
      <Head>
        <title>{`Результат игры ${playerTitleName}`}</title>
        <meta
          property="og:image"
          content={`https://${host}/api/results-image?id=${id}&name=${userName}&correct=${correctAnswersAmount}&amount=${amount}`}
        />
      </Head>
      <PageLayout user={user}>
        <Title>Результат игры</Title>
        <ResultHeader
          name={userName}
          amount={amount}
          correctAnswers={correctAnswersAmount}
        />
        <URLCopyButton host={host} />
        <Divider />
        <Title>Детали ответов</Title>
        <ResultAnswers answers={answers} animes={animes} />
      </PageLayout>
    </>
  );
});

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const gameId = ctx.query.id;
  if (isInvalidQuery(gameId)) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const session = await getServerAuthSession(ctx);
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { session, prisma },
    transformer: superjson,
  });

  let gameData = null;
  try {
    gameData = await helpers.game.getGameInfo.fetch({
      gameId,
    });
  } catch (error: unknown) {
    console.error(error);
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (!gameData.isFinished)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const { amount, animes, answers, userName, shikimoriId } = gameData;
  const parsedAnimes = await DBAnimeArraySchema.parseAsync(animes);
  const parsedAnswers = await DBAnswerArraySchema.parseAsync(answers);

  return {
    props: {
      trpcState: helpers.dehydrate(),
      user: session?.user ?? null,
      playerData: {
        id: shikimoriId ?? null,
        userName,
      },
      gameData: {
        amount,
        animes: parsedAnimes,
        answers: parsedAnswers,
      },
      host: ctx.req.headers.host ?? null,
    },
  };
}

export default ResultsPage;
