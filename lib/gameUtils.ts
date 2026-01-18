import { GameConfig, Player } from "@/types/game";

export const generatePlayerId = (name: string): string => {
  const sanitized = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  const randomPart = Math.random().toString(16).slice(2, 8);
  return `${sanitized}-${Date.now()}-${randomPart}`;
};

export const createPlayersFromNames = (names: string[]): Player[] =>
  names.map((name) => ({
    id: generatePlayerId(name),
    name,
    score: 0,
  }));

export const ensureTurnProgress = (
  players: Player[],
  progress: GameConfig["turnProgress"] | undefined,
): GameConfig["turnProgress"] => {
  if (!progress || typeof progress !== "object") {
    return {};
  }
  const valid: GameConfig["turnProgress"] = {};
  players.forEach((player) => {
    if (progress[player.id]) {
      valid[player.id] = true;
    }
  });
  return valid;
};
