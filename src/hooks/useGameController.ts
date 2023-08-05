import { useCallback, useState } from "react";

import { type DBAnswerAnime, type DBAnswerArray } from "@/schemas/db/answers";

import { api } from "@/utils/trpc/api";

import { useAnimeData } from "./useAnimeData";

interface UseGameControllerProps {
  gameId: string;
  animeIds: string;
  currentAnswers: DBAnswerArray;
}

interface OnAnswerClickOptions {
  anime: DBAnswerAnime;
  currentAnime: DBAnswerAnime;
  isFinished: boolean;
}

export function useGameController({
  gameId,
  animeIds,
  currentAnswers,
}: UseGameControllerProps) {
  const {
    data: { screenshots, decoys },
  } = useAnimeData(animeIds);
  const [answers, setAnswers] = useState(currentAnswers);
  const [isDeletingGame, setIsDeletingGame] = useState(false);

  const { mutateAsync: updateAsync } = api.game.updateGameAnswers.useMutation();
  const { mutateAsync: deleteAsync } = api.game.deleteGame.useMutation();

  const onGameExit = useCallback(async () => {
    setIsDeletingGame(true);
    await deleteAsync({ gameId });
  }, [deleteAsync, gameId]);

  const getButtonAnswers = useCallback(
    (anime: DBAnswerAnime, currentIndex: number) => {
      return [
        anime,
        ...(decoys?.slice(currentIndex * 3, (currentIndex + 1) * 3) ?? []),
      ];
    },
    [decoys],
  );

  const updateAnswers = useCallback(
    async (options: OnAnswerClickOptions) => {
      const { anime, currentAnime, isFinished } = options;
      const newAnswers = [
        ...answers,
        {
          correct: anime.id !== currentAnime.id ? currentAnime : null,
          picked: anime,
        },
      ];
      await updateAsync({
        gameId,
        answers: newAnswers,
        isFinished,
      });
      setAnswers(newAnswers);
    },
    [answers, updateAsync, gameId],
  );

  return {
    data: { screenshots, isDeletingGame },
    handlers: {
      onGameExit,
      getButtonAnswers,
      updateAnswers,
    },
  };
}
