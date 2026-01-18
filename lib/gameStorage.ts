import { GameConfig, GameStatus, LastAction, STORAGE_KEY } from "@/types/game";

const isValidStatus = (status: unknown): status is GameStatus =>
  status === "playing" || status === "finished";

const isValidPlayers = (players: unknown): players is GameConfig["players"] =>
  Array.isArray(players) &&
  players.every(
    (player) =>
      player &&
      typeof player === "object" &&
      typeof (player as GameConfig["players"][number]).id === "string" &&
      typeof (player as GameConfig["players"][number]).name === "string" &&
      typeof (player as GameConfig["players"][number]).score === "number",
  );

const isValidLastAction = (value: unknown): value is LastAction => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const action = value as Partial<LastAction>;
  return (
    typeof action.playerId === "string" &&
    typeof action.delta === "number" &&
    typeof action.turn === "number" &&
    typeof action.timestamp === "number" &&
    action.previousTurnProgress !== undefined &&
    typeof action.previousTurnProgress === "object" &&
    isValidStatus(action.previousStatus)
  );
};

const isValidTurnActions = (value: unknown): value is LastAction[] => {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every((item) => isValidLastAction(item));
};

const normalizeConfig = (raw: unknown): GameConfig | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const config = raw as Partial<GameConfig>;

  if (!isValidPlayers(config.players)) {
    return null;
  }

  if (typeof config.maxScore !== "number" || !Number.isFinite(config.maxScore)) {
    return null;
  }

  if (!isValidStatus(config.status)) {
    return null;
  }

  return {
    players: config.players,
    maxScore: config.maxScore,
    status: config.status,
    loserId: config.loserId,
    turn: typeof config.turn === "number" && Number.isFinite(config.turn) ? config.turn : 1,
    turnProgress:
      config.turnProgress && typeof config.turnProgress === "object"
        ? (config.turnProgress as GameConfig["turnProgress"])
        : {},
    turnActions: isValidTurnActions(config.turnActions) ? config.turnActions : [],
    startTime:
      typeof config.startTime === "number" && Number.isFinite(config.startTime)
        ? config.startTime
        : Date.now(),
  };
};

export const loadStoredConfig = (): GameConfig | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return normalizeConfig(parsed);
  } catch {
    return null;
  }
};

export const persistConfig = (config: GameConfig): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const clearStoredConfig = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
};
