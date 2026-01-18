export type GameStatus = "playing" | "finished";

export type Player = {
  id: string;
  name: string;
  score: number;
};

export type TurnProgress = Record<string, boolean>;

export type LastAction = {
  playerId: string;
  delta: number;
  turn: number;
  timestamp: number;
  previousTurnProgress: TurnProgress;
  previousStatus: GameStatus;
  previousLoserId?: string;
};

export type GameConfig = {
  players: Player[];
  maxScore: number;
  status: GameStatus;
  loserId?: string;
  turn: number;
  turnProgress: TurnProgress;
  turnActions: LastAction[];
  startTime?: number;
};

export const STORAGE_KEY = "death-point-game-config";
export const MIN_PLAYERS = 2;
export const DEFAULT_MAX_SCORE = 100;
