"use client";

import { useEffect, useMemo, useState } from "react";

import { clearStoredConfig, loadStoredConfig, persistConfig } from "@/lib/gameStorage";
import { createPlayersFromNames, ensureTurnProgress } from "@/lib/gameUtils";
import {
  DEFAULT_MAX_SCORE,
  GameConfig,
  GameStatus,
  LastAction,
  MIN_PLAYERS,
  Player,
} from "@/types/game";

export type ActionResult = { ok: true } | { ok: false; message: string };

const normalizeMaxScore = (value: number): number =>
  Math.max(1, Math.round(value));

const buildGameConfig = (names: string[], maxScore: number): GameConfig => ({
  players: createPlayersFromNames(names),
  maxScore: normalizeMaxScore(maxScore),
  status: "playing",
  turn: 1,
  turnProgress: {},
  turnActions: [],
  startTime: Date.now(),
});

const normalizeLoadedConfig = (config: GameConfig): GameConfig => {
  const safeTurn = Number.isFinite(config.turn) ? config.turn : 1;
  const turnProgress = ensureTurnProgress(config.players, config.turnProgress);
  return {
    ...config,
    turn: safeTurn,
    turnProgress,
    turnActions: config.turnActions || [],
  };
};

export const useGameEngine = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [config, setConfig] = useState<GameConfig | null>(null);

  useEffect(() => {
    const stored = loadStoredConfig();
    if (stored) {
      setConfig(normalizeLoadedConfig(stored));
    }
    setIsHydrated(true);
  }, []);

  const persistAndSet = (next: GameConfig | null): void => {
    setConfig(next);
    if (next) {
      persistConfig(next);
    } else {
      clearStoredConfig();
    }
  };

  const startGame = (names: string[], maxScore: number): ActionResult => {
    const trimmed = names.map((name) => name.trim()).filter(Boolean);
    if (trimmed.length < MIN_PLAYERS) {
      return { ok: false, message: `Cần ít nhất ${MIN_PLAYERS} người chơi.` };
    }

    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      return { ok: false, message: "Điểm tối đa phải lớn hơn 0." };
    }

    const normalizedMaxScore =
      Number.isFinite(maxScore) && maxScore > 0
        ? maxScore
        : DEFAULT_MAX_SCORE;

    const nextConfig = buildGameConfig(trimmed, normalizedMaxScore);
    persistAndSet(nextConfig);
    return { ok: true };
  };

  const addScore = (playerId: string, delta: number): ActionResult => {
    if (!config) {
      return { ok: false, message: "Chưa có ván chơi." };
    }

    if (config.status === "finished") {
      return { ok: false, message: "Ván chơi đã kết thúc." };
    }

    if (!Number.isFinite(delta) || delta <= 0) {
      return { ok: false, message: "Điểm cộng phải là số dương." };
    }

    setConfig((current) => {
      if (!current || current.status === "finished") {
        return current;
      }

      const players = current.players.map((player) =>
        player.id === playerId
          ? { ...player, score: player.score + delta }
          : player,
      );

      const nextTurnProgress = {
        ...current.turnProgress,
        [playerId]: true,
      };

      const nextConfig: GameConfig = {
        ...current,
        players,
        status: current.status,
        loserId: current.loserId,
        turn: current.turn,
        turnProgress: nextTurnProgress,
        turnActions: [
          ...current.turnActions,
          {
            playerId,
            delta,
            turn: current.turn,
            timestamp: Date.now(),
            previousTurnProgress: current.turnProgress,
            previousStatus: current.status,
            previousLoserId: current.loserId,
          },
        ],
      };

      persistConfig(nextConfig);
      return nextConfig;
    });

    return { ok: true };
  };

  const nextTurn = (): ActionResult => {
    if (!config) {
      return { ok: false, message: "Chưa có ván chơi." };
    }

    if (config.status === "finished") {
      return { ok: false, message: "Ván chơi đã kết thúc." };
    }

    const hasScoredCount = Object.keys(config.turnProgress).length;
    if (hasScoredCount === 0) {
      return { ok: false, message: "Chưa có ai cộng điểm trong turn này." };
    }

    setConfig((current) => {
      if (!current || current.status === "finished") {
        return current;
      }

      // Kiểm tra xem có player nào vượt max điểm không
      const overLimitPlayer = current.players.find(
        (player) => player.score >= current.maxScore,
      );

      const nextStatus: GameStatus = overLimitPlayer ? "finished" : current.status;
      const nextLoserId = overLimitPlayer ? overLimitPlayer.id : current.loserId;

      const nextConfig: GameConfig = {
        ...current,
        status: nextStatus,
        loserId: nextLoserId,
        turn: current.turn + 1,
        turnProgress: {},
        turnActions: [],
      };

      persistConfig(nextConfig);
      return nextConfig;
    });

    return { ok: true };
  };

  const restart = (): void => {
    persistAndSet(null);
  };

  const undoLast = (): ActionResult => {
    if (!config || config.turnActions.length === 0) {
      return { ok: false, message: "Không có lượt nào để hoàn tác." };
    }

    const lastAction = config.turnActions[config.turnActions.length - 1];

    if (lastAction.turn !== config.turn) {
      return { ok: false, message: "Không thể hoàn tác điểm của turn trước." };
    }

    const { playerId, delta, turn, previousTurnProgress, previousStatus, previousLoserId } =
      lastAction;

    setConfig((current) => {
      if (!current || current.turnActions.length === 0) {
        return current;
      }

      const targetPlayer = current.players.find(
        (player) => player.id === playerId,
      );
      if (!targetPlayer) {
        return current;
      }

      const players = current.players.map((player) =>
        player.id === playerId
          ? { ...player, score: Math.max(0, player.score - delta) }
          : player,
      );

      const stillOverLimit = players.find(
        (player) => player.score >= current.maxScore,
      );

      let status: GameStatus = previousStatus;
      let loserId = previousLoserId;

      if (!stillOverLimit && status === "finished") {
        status = "playing";
        loserId = undefined;
      }

      const nextConfig: GameConfig = {
        ...current,
        players,
        status,
        loserId,
        turn,
        turnProgress: previousTurnProgress ?? {},
        turnActions: current.turnActions.slice(0, -1),
      };

      persistConfig(nextConfig);
      return nextConfig;
    });

    return { ok: true };
  };

  const loser: Player | null = useMemo(() => {
    if (!config?.loserId) {
      return null;
    }
    return config.players.find((player) => player.id === config.loserId) ?? null;
  }, [config]);

  return {
    isHydrated,
    config,
    loser,
    startGame,
    addScore,
    restart,
    undoLast,
    nextTurn,
  };
};
