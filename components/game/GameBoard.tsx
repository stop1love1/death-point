"use client";

import { useMemo, useRef, useState } from "react";

import { ActionResult } from "@/hooks/useGameEngine";
import { GameConfig, Player } from "@/types/game";

const QUICK_STEPS = [1, 5, 10];

type GameBoardProps = {
  config: GameConfig;
  loser: Player | null;
  onAddScore: (playerId: string, delta: number) => ActionResult;
  onRestart: () => void;
  onUndoLast: () => ActionResult;
  onNextTurn: () => ActionResult;
};

export const GameBoard = ({
  config,
  loser,
  onAddScore,
  onRestart,
  onUndoLast,
  onNextTurn,
}: GameBoardProps) => {
  const [scoreInputs, setScoreInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [lastAdds, setLastAdds] = useState<
    Record<string, { delta: number; time: number }>
  >({});
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editConfig, setEditConfig] = useState<GameConfig | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const submitDelta = (playerId: string, delta: number): void => {
    setError("");

    if (!Number.isFinite(delta) || delta <= 0) {
      setError("Điểm cộng phải là số dương.");
      return;
    }

    const result = onAddScore(playerId, delta);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setScoreInputs((prev) => ({ ...prev, [playerId]: "" }));
    setLastAdds((prev) => ({
      ...prev,
      [playerId]: { delta, time: Date.now() },
    }));

    // Focus vào input tiếp theo
    if (config.status !== "finished") {
      const currentIndex = config.players.findIndex((p) => p.id === playerId);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % config.players.length;
        const nextPlayerId = config.players[nextIndex].id;
        setTimeout(() => {
          inputRefs.current[nextPlayerId]?.focus();
        }, 0);
      }
    }
  };

  const handleScoreSubmit = (playerId: string): void => {
    const rawValue = scoreInputs[playerId] ?? "";
    const delta = Number(rawValue);
    submitDelta(playerId, delta);
  };

  const handleUndo = (playerId: string): void => {
    const lastAction = config.turnActions[config.turnActions.length - 1];
    if (!lastAction || lastAction.playerId !== playerId) {
      setError("Chỉ hoàn tác lượt cộng cuối cùng của người vừa cộng.");
      return;
    }
    const result = onUndoLast();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setScoreInputs((prev) => ({ ...prev, [playerId]: "" }));
  };

  const handleRestartClick = (): void => {
    setShowRestartConfirm(true);
  };

  const handleRestartConfirm = (): void => {
    onRestart();
    setShowRestartConfirm(false);
  };

  const handleRestartCancel = (): void => {
    setShowRestartConfirm(false);
  };

  const handleSettingsClick = (): void => {
    setEditConfig(JSON.parse(JSON.stringify(config)));
    setShowSettings(true);
  };

  const handleSettingsCancel = (): void => {
    setShowSettings(false);
    setEditConfig(null);
  };

  const handleSettingsSave = (): void => {
    if (!editConfig) return;
    
    if (typeof window !== "undefined") {
      window.localStorage.setItem("death-point-game-config", JSON.stringify(editConfig));
      window.location.reload();
    }
  };

  const handleEditPlayer = (index: number, field: "name" | "score", value: string): void => {
    if (!editConfig) return;
    
    const newPlayers = [...editConfig.players];
    if (field === "name") {
      newPlayers[index] = { ...newPlayers[index], name: value };
    } else if (field === "score") {
      const numValue = Number(value);
      if (Number.isFinite(numValue)) {
        newPlayers[index] = { ...newPlayers[index], score: numValue };
      }
    }
    
    setEditConfig({ ...editConfig, players: newPlayers });
  };

  const handleEditMaxScore = (value: string): void => {
    if (!editConfig) return;
    const numValue = Number(value);
    if (Number.isFinite(numValue)) {
      setEditConfig({ ...editConfig, maxScore: numValue });
    }
  };

  const handleEditTurn = (value: string): void => {
    if (!editConfig) return;
    const numValue = Number(value);
    if (Number.isFinite(numValue) && numValue >= 1) {
      setEditConfig({ ...editConfig, turn: numValue });
    }
  };

  const handleNextTurn = (): void => {
    const result = onNextTurn();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setLastAdds({});
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const isFinished = config.status === "finished";
  const safePlayers =
    loser && isFinished
      ? config.players.filter((player) => player.id !== loser.id)
      : [];

  const scoredCount = Object.keys(config.turnProgress).length;
  const canNextTurn = scoredCount > 0 && !isFinished;
  const lastAction = config.turnActions[config.turnActions.length - 1];
  const canUndo = config.turnActions.length > 0 && lastAction && lastAction.turn === config.turn;

  const getPlayerRank = (playerId: string): number => {
    const sortedByScore = [...config.players].sort((a, b) => b.score - a.score);
    const index = sortedByScore.findIndex((p) => p.id === playerId);
    if (index === -1) return -1;
    
    const playerScore = sortedByScore[index].score;
    const uniqueScores = Array.from(new Set(sortedByScore.map(p => p.score))).sort((a, b) => b - a);
    return uniqueScores.indexOf(playerScore) + 1;
  };

  const calculateLoseProbability = (player: Player): number => {
    if (isFinished) return player.id === config.loserId ? 100 : 0;
    
    // Nếu tất cả người chơi đều có điểm bằng 0 thì không tính xác suất
    const allScoresZero = config.players.every((p) => p.score === 0);
    if (allScoresZero) return 0;
    
    const remaining = config.maxScore - player.score;
    if (remaining <= 0) return 100;
    
    const totalScore = config.players.reduce((sum, p) => sum + p.score, 0);
    const avgScore = totalScore / config.players.length;
    
    const relativeScore = player.score - avgScore;
    const maxRemaining = Math.max(...config.players.map(p => config.maxScore - p.score));
    const minRemaining = Math.min(...config.players.map(p => config.maxScore - p.score));
    const remainingRange = maxRemaining - minRemaining;
    
    let baseProbability = 100;
    if (remainingRange > 0) {
      const normalizedPosition = (maxRemaining - remaining) / remainingRange;
      baseProbability = normalizedPosition * 100;
    }
    
    const highestScorePlayer = [...config.players].sort((a, b) => b.score - a.score)[0];
    const scoreDifference = player.score - highestScorePlayer.score;
    if (scoreDifference === 0 && player.id === highestScorePlayer.id) {
      baseProbability = Math.max(baseProbability, 70);
    } else if (scoreDifference === 0) {
      baseProbability = Math.max(baseProbability, 65);
    }
    
    if (remaining <= 5) {
      baseProbability = Math.max(baseProbability, 80);
    } else if (remaining <= 10) {
      baseProbability = Math.max(baseProbability, 60);
    }
    
    return Math.min(100, Math.max(0, Math.round(baseProbability)));
  };

  const calculateExpectedTurnsToFinish = (player: Player): number | null => {
    if (isFinished) return null;
    
    // Nếu điểm = 0 thì không tính
    if (player.score === 0) return null;
    
    const remaining = config.maxScore - player.score;
    if (remaining <= 0) return 0;
    
    // Tính trung bình điểm mỗi turn của người chơi này
    // Group actions theo turn và tính tổng điểm mỗi turn
    const playerActions = config.turnActions.filter((action) => action.playerId === player.id);
    
    if (playerActions.length === 0) {
      // Nếu chưa có dữ liệu của người chơi này, dùng trung bình chung
      const allActions = config.turnActions;
      if (allActions.length === 0) {
        // Nếu chưa có dữ liệu gì, ước tính dựa trên điểm hiện tại và số turn
        // Giả sử mỗi turn mỗi người cộng khoảng 10-15 điểm (ước tính)
        const estimatedPerTurn = 12;
        return Math.ceil(remaining / estimatedPerTurn);
      }
      
      // Tính trung bình điểm mỗi turn của tất cả người chơi
      // Group actions theo turn và player, tính tổng điểm mỗi turn của mỗi player
      const turnPlayerScores = new Map<string, number>();
      allActions.forEach((action) => {
        const key = `${action.turn}-${action.playerId}`;
        turnPlayerScores.set(key, (turnPlayerScores.get(key) || 0) + action.delta);
      });
      
      const scoresPerTurn = Array.from(turnPlayerScores.values());
      const avgPerTurn = scoresPerTurn.length > 0 
        ? scoresPerTurn.reduce((sum, score) => sum + score, 0) / scoresPerTurn.length 
        : 0;
      
      if (avgPerTurn <= 0) return null;
      return Math.ceil(remaining / avgPerTurn);
    }
    
    // Tính tổng điểm mỗi turn của người chơi này
    const turnScores = new Map<number, number>();
    playerActions.forEach((action) => {
      turnScores.set(action.turn, (turnScores.get(action.turn) || 0) + action.delta);
    });
    
    const scoresPerTurn = Array.from(turnScores.values());
    const avgPerTurn = scoresPerTurn.length > 0 
      ? scoresPerTurn.reduce((sum, score) => sum + score, 0) / scoresPerTurn.length 
      : 0;
    
    if (avgPerTurn <= 0) {
      // Nếu chưa có đủ dữ liệu, dùng trung bình chung
      const allActions = config.turnActions;
      if (allActions.length === 0) {
        const estimatedPerTurn = 12;
        return Math.ceil(remaining / estimatedPerTurn);
      }
      
      const turnPlayerScores = new Map<string, number>();
      allActions.forEach((action) => {
        const key = `${action.turn}-${action.playerId}`;
        turnPlayerScores.set(key, (turnPlayerScores.get(key) || 0) + action.delta);
      });
      
      const scoresPerTurnAll = Array.from(turnPlayerScores.values());
      const avgPerTurnAll = scoresPerTurnAll.length > 0 
        ? scoresPerTurnAll.reduce((sum, score) => sum + score, 0) / scoresPerTurnAll.length 
        : 0;
      
      if (avgPerTurnAll <= 0) return null;
      return Math.ceil(remaining / avgPerTurnAll);
    }
    
    return Math.ceil(remaining / avgPerTurn);
  };

  return (
    <div className="space-y-3">
      {showSettings && editConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/90 via-slate-900/90 to-slate-950/90 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-zinc-700/50 p-4 sm:p-6">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 sm:h-12 sm:w-12">
                <span className="text-xl sm:text-2xl">⚙️</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-base font-bold text-indigo-100 sm:text-lg">
                  Cài đặt nâng cao
                </p>
                <p className="truncate text-[11px] text-zinc-400 sm:text-xs">
                  Chỉnh sửa trực tiếp Local Storage
                </p>
              </div>
              <button
                type="button"
                onClick={handleSettingsCancel}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800/50 text-zinc-400 transition hover:bg-zinc-700/50 hover:text-zinc-200"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:space-y-4 sm:p-6">
              <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-3 sm:p-4">
                <label className="mb-2 block text-xs font-semibold text-zinc-200 sm:text-sm">
                  Điểm tối đa
                </label>
                <input
                  type="number"
                  min={1}
                  value={editConfig.maxScore}
                  onChange={(e) => handleEditMaxScore(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:py-2"
                />
              </div>

              <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-3 sm:p-4">
                <label className="mb-2 block text-xs font-semibold text-zinc-200 sm:text-sm">
                  Turn hiện tại
                </label>
                <input
                  type="number"
                  min={1}
                  value={editConfig.turn}
                  onChange={(e) => handleEditTurn(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:py-2"
                />
              </div>

              <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-3 sm:p-4">
                <label className="mb-2 block text-xs font-semibold text-zinc-200 sm:text-sm">
                  Người chơi ({editConfig.players.length})
                </label>
                <div className="space-y-2 sm:space-y-2.5">
                  {editConfig.players.map((player, index) => (
                    <div key={player.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <span className="text-xs font-medium text-zinc-400 sm:w-8">#{index + 1}</span>
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleEditPlayer(index, "name", e.target.value)}
                        placeholder="Tên"
                        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:py-2"
                      />
                      <input
                        type="number"
                        value={player.score}
                        onChange={(e) => handleEditPlayer(index, "score", e.target.value)}
                        placeholder="Điểm"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 sm:w-28 sm:py-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[11px] text-amber-200 sm:text-xs">
                  ⚠️ Lưu ý: Thay đổi sẽ ghi đè Local Storage và reload trang.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-zinc-700/50 p-4 sm:flex-row sm:gap-3 sm:p-6">
              <button
                type="button"
                onClick={handleSettingsCancel}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700/50 sm:py-2.5"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSettingsSave}
                className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:from-indigo-500 hover:to-indigo-400 sm:py-2.5"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-gradient-to-br from-red-950/90 via-zinc-900/90 to-zinc-950/90 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <p className="text-lg font-bold text-red-100">
                  Xác nhận khởi động lại
                </p>
                <p className="text-xs text-zinc-400">
                  Toàn bộ dữ liệu sẽ bị xóa
                </p>
              </div>
            </div>
            <p className="mb-6 text-sm text-zinc-300">
              Bạn có chắc muốn khởi động lại? Điểm và lịch sử của ván chơi này sẽ bị mất.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRestartCancel}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-700/50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRestartConfirm}
                className="flex-1 rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:from-red-500 hover:to-red-400"
              >
                Khởi động lại
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg ring-2 ring-emerald-500/20">
              <span className="text-xl">🎴</span>
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                Turn {config.turn}
              </p>
              <p className="text-xs text-zinc-400">
                {scoredCount}/{config.players.length} đã cộng điểm
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canNextTurn && (
              <button
                type="button"
                onClick={handleNextTurn}
                className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-lg ring-1 ring-emerald-500/30 transition hover:shadow-emerald-500/25"
                aria-label="Turn tiếp theo"
              >
                Turn {config.turn + 1} →
              </button>
            )}
            <button
              type="button"
              onClick={handleSettingsClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-base text-zinc-300 backdrop-blur-sm transition hover:bg-zinc-700/80 hover:text-white"
              aria-label="Settings"
            >
              ⚙️
            </button>
            <button
              type="button"
              onClick={handleRestartClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-base text-zinc-300 backdrop-blur-sm transition hover:bg-zinc-700/80 hover:text-white"
              aria-label="Restart"
            >
              ⟳
            </button>
          </div>
        </div>
      </div>

      {isFinished && loser && (
        <div className="overflow-hidden rounded-xl border border-amber-400/40 bg-gradient-to-br from-amber-900/30 via-amber-950/20 to-orange-950/30 p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <span className="text-3xl">🏆</span>
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-100">
                Ván chơi kết thúc
              </p>
              <p className="text-xs text-zinc-400">
                Thống kê và kết quả
              </p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-3">
              <p className="mb-1 text-xs text-red-300">Người thua</p>
              <p className="text-lg font-bold text-red-100">{loser.name}</p>
              <p className="text-xs text-zinc-400">
                Điểm cuối: <span className="font-semibold text-red-200">{loser.score}</span> / {config.maxScore}
              </p>
            </div>
            
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-900/20 p-3">
              <p className="mb-1 text-xs text-emerald-300">Người thắng</p>
              {safePlayers.length > 0 && (
                <div className="space-y-1">
                  {safePlayers.slice(0, 3).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-100">
                        {index === 0 && "🥇"} {index === 1 && "🥈"} {index === 2 && "🥉"} {player.name}
                      </span>
                      <span className="text-xs text-zinc-400">{player.score} điểm</span>
                    </div>
                  ))}
                  {safePlayers.length > 3 && (
                    <p className="text-xs text-zinc-500">+{safePlayers.length - 3} người khác</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-3 text-center">
              <p className="text-xs text-zinc-400">Tổng số turn</p>
              <p className="text-2xl font-bold text-indigo-300">{config.turn}</p>
            </div>
            <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-3 text-center">
              <p className="text-xs text-zinc-400">Thời gian chơi</p>
              <p className="text-2xl font-bold text-indigo-300">
                {config.startTime ? formatDuration(Date.now() - config.startTime) : "--"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-zinc-700/50 bg-zinc-900/60 p-3">
            <p className="mb-2 text-xs font-semibold text-zinc-300">Bảng xếp hạng cuối cùng</p>
            <div className="space-y-1">
              {safePlayers.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    player.id === loser.id ? "bg-red-500/10" : "bg-emerald-500/5"
                  }`}
                >
                  <span className="text-sm text-zinc-200">
                    #{index + 1} {player.name}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-100">
            {error}
          </p>
        )}

        <div className="space-y-2">
          {config.players.map((player) => {
            const rank = getPlayerRank(player.id);
            const probability = calculateLoseProbability(player);
            const expectedTurns = calculateExpectedTurnsToFinish(player);
            const isDanger = rank === 1 && !isFinished;

            return (
              <div
                key={player.id}
                className="group relative overflow-hidden rounded-xl border border-zinc-800/60 bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80 p-3 shadow-lg backdrop-blur-sm transition-all hover:border-zinc-700/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate">
                        {player.name}
                      </h3>
                      {isDanger && (
                        <span className="text-base animate-pulse flex-shrink-0">🔥</span>
                      )}
                      {isFinished && player.id === config.loserId && (
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-300 ring-1 ring-red-500/30 flex-shrink-0">
                          ❌ Thua
                        </span>
                      )}
                    </div>
                    {lastAdds[player.id] && (
                      <p className="text-[10px] text-zinc-500">
                        +{lastAdds[player.id].delta} • {new Date(lastAdds[player.id].time).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                    {!isFinished && (
                      <div className="mt-2 space-y-2">
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                              Xác suất thua
                            </span>
                            <span className="text-xs font-bold text-emerald-400">
                              {probability}%
                            </span>
                          </div>
                          <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-950/50 ring-1 ring-slate-800/80">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 transition-all duration-700"
                              style={{ width: `${probability}%` }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                            </div>
                          </div>
                        </div>
                        {expectedTurns !== null && (
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                Dự kiến kết thúc
                              </span>
                              <span className="text-xs font-bold text-amber-400">
                                ~{expectedTurns} turn
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <p className="text-2xl font-black text-emerald-400">
                      {player.score}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={(el) => {
                          inputRefs.current[player.id] = el;
                        }}
                        type="number"
                        min={1}
                        value={scoreInputs[player.id] ?? ""}
                        onChange={(event) =>
                          setScoreInputs((prev) => ({
                            ...prev,
                            [player.id]: event.target.value,
                          }))
                        }
                        disabled={isFinished}
                        placeholder="+"
                        inputMode="numeric"
                        pattern="\d*"
                        autoComplete="off"
                        className="w-20 rounded-lg border border-zinc-700/80 bg-slate-900/80 px-2 py-1.5 text-sm font-medium text-white placeholder-zinc-500 outline-none ring-0 transition focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleScoreSubmit(player.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleScoreSubmit(player.id)}
                        disabled={isFinished}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-700 text-base text-white shadow-md ring-1 ring-emerald-500/30 transition hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Cộng cho ${player.name}`}
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {QUICK_STEPS.map((step) => (
                        <button
                          key={step}
                          type="button"
                          disabled={isFinished}
                          onClick={() => submitDelta(player.id, step)}
                          className="rounded border border-zinc-700/60 bg-zinc-800/60 px-2 py-1 text-[11px] font-bold text-zinc-300 backdrop-blur-sm transition hover:border-emerald-500/40 hover:bg-emerald-900/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`+${step} cho ${player.name}`}
                        >
                          +{step}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleUndo(player.id)}
                        disabled={!lastAction || lastAction.playerId !== player.id || !canUndo}
                        className="rounded border border-amber-700/60 bg-amber-900/30 px-2 py-1 text-[11px] font-bold text-amber-300 backdrop-blur-sm transition hover:border-amber-500/60 hover:bg-amber-800/40 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Undo cho ${player.name}`}
                      >
                        ↩
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
