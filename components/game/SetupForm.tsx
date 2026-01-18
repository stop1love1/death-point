"use client";

import { FormEvent, useState } from "react";

import { ActionResult } from "@/hooks/useGameEngine";
import { DEFAULT_MAX_SCORE, MIN_PLAYERS } from "@/types/game";

type SetupFormProps = {
  onStart: (names: string[], maxScore: number) => ActionResult;
};

const buildEmptyNames = (count: number): string[] =>
  Array.from({ length: count }, () => "");

export const SetupForm = ({ onStart }: SetupFormProps) => {
  const [playerNames, setPlayerNames] = useState<string[]>(
    buildEmptyNames(5),
  );
  const [maxScoreInput, setMaxScoreInput] = useState(
    DEFAULT_MAX_SCORE.toString(),
  );
  const [error, setError] = useState("");

  const handlePlayerNameChange = (index: number, value: string): void => {
    setPlayerNames((prev) =>
      prev.map((name, currentIndex) =>
        currentIndex === index ? value : name,
      ),
    );
  };

  const handleAddPlayerField = (): void => {
    setPlayerNames((prev) => [...prev, ""]);
  };

  const handleRemovePlayerField = (index: number): void => {
    setPlayerNames((prev) => {
      if (prev.length <= MIN_PLAYERS) {
        return prev;
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError("");

    const parsedMaxScore = Number(maxScoreInput);
    const result = onStart(playerNames, parsedMaxScore);

    if (!result.ok) {
      setError(result.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/50 via-zinc-900/80 to-zinc-950/50 p-6 shadow-2xl backdrop-blur-sm"
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
      
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
            <span className="text-2xl">🎴</span>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-100">
              Ván chơi mới
            </p>
            <p className="text-xs text-zinc-400">
              Thiết lập người chơi và điểm giới hạn
            </p>
          </div>
        </div>
      </div>

      <div className="relative space-y-3">
        <label className="text-sm font-semibold text-emerald-100">
          Người chơi (tối thiểu {MIN_PLAYERS})
        </label>
        <div className="space-y-3">
          {playerNames.map((name, index) => (
            <div
              key={`${index}-${name}`}
              className="flex items-center gap-3"
            >
              <input
                value={name}
                onChange={(event) =>
                  handlePlayerNameChange(index, event.target.value)
                }
                placeholder={`Người chơi ${index + 1}`}
                className="flex-1 rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
              />
              {playerNames.length > MIN_PLAYERS && (
                <button
                  type="button"
                  onClick={() => handleRemovePlayerField(index)}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20"
                  aria-label={`Xóa người chơi ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleAddPlayerField}
          className="rounded-lg border border-dashed border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-500 hover:bg-emerald-500/10"
        >
          + Thêm người chơi
        </button>
      </div>

      <div className="relative space-y-2">
        <label className="text-sm font-semibold text-emerald-100" htmlFor="maxScore">
          Điểm tối đa
        </label>
        <input
          id="maxScore"
          type="number"
          min={1}
          value={maxScoreInput}
          onChange={(event) => setMaxScoreInput(event.target.value)}
          className="w-full rounded-lg border border-emerald-500/30 bg-zinc-900/80 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          placeholder={`Mặc định ${DEFAULT_MAX_SCORE}`}
        />
        <p className="text-xs text-zinc-400">
          Người chơi đạt hoặc vượt mốc này sẽ thua.
        </p>
      </div>

      {error && (
        <p className="relative rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="relative w-full rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 text-base font-bold text-white shadow-lg transition hover:from-emerald-500 hover:to-emerald-400"
      >
        Bắt đầu ván chơi
      </button>
    </form>
  );
};
