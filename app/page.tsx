"use client";

import { GameBoard } from "@/components/game/GameBoard";
import { SetupForm } from "@/components/game/SetupForm";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function HomePage() {
  const { isHydrated, config, loser, startGame, addScore, restart, undoLast, nextTurn } =
    useGameEngine();

  if (!isHydrated) {
    return (
      <div className="card-table-pattern flex min-h-screen items-center justify-center text-zinc-200">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/30 border-t-emerald-500"></div>
          <p className="text-lg font-semibold">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="card-table-pattern min-h-screen px-3 py-6 text-zinc-100 sm:px-4 sm:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        {!config && (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-red-800 shadow-lg">
              <span className="text-2xl">🃏</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Death Point</h1>
              <p className="text-xs text-zinc-400">Trò chơi tính điểm</p>
            </div>
          </div>
        )}
        {!config ? (
          <SetupForm onStart={startGame} />
        ) : (
          <GameBoard
            config={config}
            loser={loser}
            onAddScore={addScore}
            onRestart={restart}
            onUndoLast={undoLast}
            onNextTurn={nextTurn}
          />
        )}
      </div>
    </main>
  );
}
