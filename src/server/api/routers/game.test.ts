import { afterEach, describe, expect, it, vi } from "vitest";

import { appRouter } from "@/server/api/root";
import { createCallerFactory, createInnerTRPCContext } from "@/server/api/trpc";

import { prisma as prismaMock } from "@/mocks/prisma";

import { accountDataMock } from "../__mocks__/accountData";
import { createGameDataMock, gameDataMock } from "../__mocks__/gameData";
import { emptySession, exampleSession } from "../__mocks__/session";
import { userAccountMock } from "../__mocks__/userAccount";
import { userDataMock } from "../__mocks__/userData";

vi.mock("../../db");

describe("Game Router Test (createGame route)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unauthed user should not be able to create game", async () => {
    const ctx = createInnerTRPCContext(emptySession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = caller.game.createGame({
      options: { limit: 5 },
    });

    await expect(example).rejects.toThrow();
  });

  it("authed user should be able to create game", async () => {
    prismaMock.game.create.mockResolvedValueOnce(createGameDataMock);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = await caller.game.createGame({
      options: { limit: 5 },
    });

    expect(example).toBe(createGameDataMock.id);
  });

  it("should fail on empty options", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const exampleUndefinedInput = caller.game.createGame(undefined as never);

    await expect(exampleUndefinedInput).rejects.toThrow();

    const exampleUndefinedOptions = caller.game.createGame({
      options: undefined as never,
    });

    await expect(exampleUndefinedOptions).rejects.toThrow();
  });

  it("should fail on incorrect amount range", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const exampleMin = caller.game.createGame({
      options: { limit: 0 },
    });

    await expect(exampleMin).rejects.toThrow();

    const exampleMax = caller.game.createGame({
      options: { limit: 727 },
    });

    await expect(exampleMax).rejects.toThrow();
  });

  it("should fail on incorrect score range", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const exampleMin = caller.game.createGame({
      options: { limit: 5, score: 0 },
    });

    await expect(exampleMin).rejects.toThrow();

    const exampleMax = caller.game.createGame({
      options: { limit: 5, score: 10 },
    });

    await expect(exampleMax).rejects.toThrow();
  });
});

describe("Game Router Test (getGameInfo route)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unauthed user should be able to get game info", async () => {
    prismaMock.game.findUniqueOrThrow.mockResolvedValueOnce(createGameDataMock);
    // @ts-expect-error This findUnique returns accounts data
    prismaMock.user.findUnique.mockResolvedValueOnce(userAccountMock);

    const ctx = createInnerTRPCContext(emptySession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = await caller.game.getGameInfo({
      gameId: createGameDataMock.id,
    });

    expect(example).toEqual({
      ...createGameDataMock,
      shikimoriId: accountDataMock.providerAccountId,
      userName: userDataMock.name,
    });
  });

  it("authed user should be able to get game info", async () => {
    prismaMock.game.findUniqueOrThrow.mockResolvedValueOnce(createGameDataMock);
    // @ts-expect-error This findUnique returns accounts data
    prismaMock.user.findUnique.mockResolvedValueOnce(userAccountMock);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = await caller.game.getGameInfo({
      gameId: createGameDataMock.id,
    });

    expect(example).toEqual({
      ...createGameDataMock,
      shikimoriId: accountDataMock.providerAccountId,
      userName: userDataMock.name,
    });
  });

  it("should fail on empty input", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = appRouter.createCaller(ctx);

    const example = caller.game.getGameInfo(undefined as never);

    await expect(example).rejects.toThrow();
  });

  it("should fail on non-cuid input", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = appRouter.createCaller(ctx);

    const exampleNonCUID = caller.game.getGameInfo({
      gameId: "123",
    });

    await expect(exampleNonCUID).rejects.toThrow();
  });

  it("should fail on wrong gameId", async () => {
    prismaMock.game.findUniqueOrThrow.mockRejectedValueOnce(null);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const exampleWrongID = caller.game.getGameInfo({
      gameId: "cll1arbun000008ju3vrp330b",
    });

    await expect(exampleWrongID).rejects.toThrow();
  });
});

describe("Game Router Test (updateGameAnswers route)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unauthed user should not be able to update game answers", async () => {
    const ctx = createInnerTRPCContext(emptySession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = caller.game.updateGameAnswers({
      gameId: gameDataMock.id,
      answers: [],
      isFinished: false,
    });

    await expect(example).rejects.toThrow();
  });

  it("authed user should be able to update game answers", async () => {
    prismaMock.game.update.mockResolvedValueOnce(gameDataMock);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = await caller.game.updateGameAnswers({
      gameId: gameDataMock.id,
      answers: gameDataMock.answers,
      isFinished: gameDataMock.isFinished,
    });

    expect(example).toEqual(gameDataMock);
  });

  it("should fail on empty input", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = caller.game.updateGameAnswers(undefined as never);

    await expect(example).rejects.toThrow();
  });

  it("should fail on invalid input", async () => {
    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const exampleEmptyID = caller.game.updateGameAnswers({
      gameId: "",
      answers: [],
    });

    await expect(exampleEmptyID).rejects.toThrow();

    const exampleNonCUID = caller.game.updateGameAnswers({
      gameId: "123",
      answers: [],
    });

    await expect(exampleNonCUID).rejects.toThrow();
  });
});

describe("Game Router Test (deleteGame route)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("unauthed user should not be able to delete game", async () => {
    const ctx = createInnerTRPCContext(emptySession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = caller.game.deleteGame({
      gameId: gameDataMock.id,
    });

    await expect(example).rejects.toThrow();
  });

  it("authed user should be able to delete game", async () => {
    prismaMock.game.create.mockResolvedValueOnce(gameDataMock);
    prismaMock.game.delete.mockResolvedValueOnce(gameDataMock);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = await caller.game.deleteGame({
      gameId: gameDataMock.id,
    });

    expect(example).toBe(gameDataMock.id);
  });

  it("should fail on empty input", async () => {
    prismaMock.game.create.mockResolvedValueOnce(gameDataMock);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const example = caller.game.deleteGame(undefined as never);

    await expect(example).rejects.toThrow();
  });

  it("should fail on incorrect gameId", async () => {
    prismaMock.game.create.mockResolvedValueOnce(gameDataMock);

    const ctx = createInnerTRPCContext(exampleSession);
    const caller = createCallerFactory(appRouter)({
      ...ctx,
      prisma: prismaMock,
    });

    const exampleEmpty = caller.game.deleteGame({ gameId: "" });

    await expect(exampleEmpty).rejects.toThrow();

    const exampleNonCuid = caller.game.deleteGame({ gameId: "123" });

    await expect(exampleNonCuid).rejects.toThrow();
  });
});
