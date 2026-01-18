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
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
        <div className="flex-1 space-y-4">
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
        <footer className="mt-8 border-t border-zinc-800/50 pt-6 text-center">
          <div className="flex flex-col items-center gap-2 text-sm text-zinc-400">
            <p className="text-xs text-zinc-500">
              Made with ❤️ by{" "}
              <a
                href="https://github.com/stop1love1"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 transition hover:text-emerald-300"
              >
                stop1love1
              </a>
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a
                href="https://github.com/stop1love1/death-point"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 transition hover:text-zinc-300"
              >
                Repository
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="https://github.com/stop1love1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 transition hover:text-zinc-300"
              >
                GitHub
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="https://death-point.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 transition hover:text-zinc-300"
              >
                Demo
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
