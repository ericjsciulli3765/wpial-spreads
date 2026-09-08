"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Game = {
  id: number | string;
  away_team: string;
  home_team: string;
  spread: number | null;
  away_score: number | null;
  home_score: number | null;
  game_time?: string;
};

type PickItem = {
  game_id: number | string;
  picked_team: string;
  is_lock?: boolean;
};

export default function PicksList({
  games,
  userId,
}: {
  games: Game[];
  userId: string;
}) {
  const [picks, setPicks] = useState<Record<string, PickItem>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadPicks() {
      const { data, error } = await supabase
        .from("picks")
        .select("game_id, picked_team, is_lock")
        .eq("user_id", userId);

      if (!error && data) {
        const pickMap: Record<string, PickItem> = {};
        data.forEach((pk) => {
          pickMap[String(pk.game_id)] = pk;
        });
        setPicks(pickMap);
      }
      setLoading(false);
    }

    loadPicks();
  }, [userId, supabase]);

  // Helper: Calculate spread winner for completed games
  const getSpreadWinner = (game: Game): string | "PUSH" | null => {
    if (game.away_score === null || game.home_score === null) return null;

    const spread = game.spread ?? 0;
    const homeTotal = game.home_score + spread;

    if (homeTotal > game.away_score) return game.home_team;
    if (homeTotal < game.away_score) return game.away_team;
    return "PUSH";
  };

  // Helper: Format team spread display (+6.5, -6.5, or PK)
  const getTeamSpread = (game: Game, isHome: boolean) => {
    if (game.spread === null || game.spread === 0) return "PK";

    const teamSpread = isHome ? game.spread : -game.spread;
    return teamSpread > 0 ? `+${teamSpread}` : `${teamSpread}`;
  };

  // Helper: Get button container styling based on game outcome & user pick
  const getButtonStyle = (game: Game, teamName: string) => {
    const userPick = picks[String(game.id)];
    const isPicked = userPick?.picked_team === teamName;
    const winner = getSpreadWinner(game);

    // If game isn't finished yet
    if (!winner) {
      if (isPicked) {
        return "bg-blue-600/30 border-blue-500 text-white font-semibold ring-2 ring-blue-500/50";
      }
      return "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700";
    }

    // If game is completed
    if (isPicked) {
      if (winner === "PUSH") {
        return "bg-amber-500/20 border-amber-500 text-amber-300 font-bold";
      }
      if (winner === teamName) {
        return "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10";
      }
      return "bg-rose-500/20 border-rose-500 text-rose-400 font-bold";
    }

    return "bg-slate-900/50 border-slate-800 text-slate-500 opacity-60";
  };

  const handleSelectTeam = async (gameId: number | string, team: string) => {
    const isGameFinished =
      games.find((g) => String(g.id) === String(gameId))?.away_score !== null;

    if (isGameFinished) return;

    const currentLock = picks[String(gameId)]?.is_lock || false;

    setPicks((prev) => ({
      ...prev,
      [String(gameId)]: {
        game_id: gameId,
        picked_team: team,
        is_lock: currentLock,
      },
    }));

    await supabase.from("picks").upsert({
      user_id: userId,
      game_id: gameId,
      picked_team: team,
      is_lock: currentLock,
    });
  };

  const handleToggleLock = async (gameId: number | string) => {
    const currentPick = picks[String(gameId)];
    if (!currentPick?.picked_team) return;

    const isGameFinished =
      games.find((g) => String(g.id) === String(gameId))?.away_score !== null;

    if (isGameFinished) return;

    const newLockState = !currentPick.is_lock;

    const updatedPicks = { ...picks };
    Object.keys(updatedPicks).forEach((key) => {
      if (updatedPicks[key].is_lock) {
        updatedPicks[key] = { ...updatedPicks[key], is_lock: false };
      }
    });

    updatedPicks[String(gameId)] = {
      ...currentPick,
      is_lock: newLockState,
    };

    setPicks(updatedPicks);

    await supabase
      .from("picks")
      .update({ is_lock: false })
      .eq("user_id", userId);

    if (newLockState) {
      await supabase
        .from("picks")
        .update({ is_lock: true })
        .eq("user_id", userId)
        .eq("game_id", gameId);
    }
  };

  if (loading) {
    return <p className="text-slate-400">Loading your picks...</p>;
  }

  return (
    <div className="space-y-6">
      {games.map((game) => {
        const userPick = picks[String(game.id)];
        const winner = getSpreadWinner(game);
        const isFinished = game.away_score !== null && game.home_score !== null;

        const awaySpreadStr = getTeamSpread(game, false);
        const homeSpreadStr = getTeamSpread(game, true);

        return (
          <div
            key={game.id}
            className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-md"
          >
            {/* Header: Scores or Game Status */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs font-medium uppercase tracking-wider text-slate-400">
              <span className="font-semibold text-slate-400">Matchup</span>

              {isFinished ? (
                <span className="font-mono text-sm font-bold text-slate-200">
                  Final: {game.away_team} {game.away_score} - {game.home_score}{" "}
                  {game.home_team}
                </span>
              ) : (
                <span className="text-slate-500">Upcoming</span>
              )}
            </div>

            {/* Team Pick Options with Spreads */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Away Team Button */}
              <button
                disabled={isFinished}
                onClick={() => handleSelectTeam(game.id, game.away_team)}
                className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${getButtonStyle(
                  game,
                  game.away_team
                )}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{game.away_team}</span>
                  <span className="text-sm font-bold text-slate-400">
                    ({awaySpreadStr})
                  </span>
                </div>

                {userPick?.picked_team === game.away_team && (
                  <span className="rounded-md bg-slate-950/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                    {winner
                      ? winner === "PUSH"
                        ? "PUSH"
                        : winner === game.away_team
                        ? "WIN"
                        : "LOSS"
                      : "PICKED"}
                  </span>
                )}
              </button>

              {/* Home Team Button */}
              <button
                disabled={isFinished}
                onClick={() => handleSelectTeam(game.id, game.home_team)}
                className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${getButtonStyle(
                  game,
                  game.home_team
                )}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{game.home_team}</span>
                  <span className="text-sm font-bold text-slate-400">
                    ({homeSpreadStr})
                  </span>
                </div>

                {userPick?.picked_team === game.home_team && (
                  <span className="rounded-md bg-slate-950/60 px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                    {winner
                      ? winner === "PUSH"
                        ? "PUSH"
                        : winner === game.home_team
                        ? "WIN"
                        : "LOSS"
                      : "PICKED"}
                  </span>
                )}
              </button>
            </div>

            {/* Lock Designation / Lock Toggle Section */}
            {userPick?.picked_team && (
              <div className="mt-4 flex items-center justify-end">
                {isFinished ? (
                  userPick.is_lock && (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400">
                      ⭐ Lock of the Week
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => handleToggleLock(game.id)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                      userPick.is_lock
                        ? "border border-amber-500/50 bg-amber-500/20 text-amber-400"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    ⭐ {userPick.is_lock ? "Lock of the Week" : "Set as Lock"}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}