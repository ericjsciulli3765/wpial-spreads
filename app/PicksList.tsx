"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Game = {
  id: number | string;
  away_team: string;
  home_team: string;
  spread: number | null;
  game_time: string;
};

type Pick = {
  game_id: number | string;
  picked_team: string;
  is_lock?: boolean;
};

function formatSpread(spread: number | null) {
  if (spread === null || spread === undefined) return "";
  if (spread > 0) return `+${spread}`;
  return `${spread}`;
}

export default function PicksList({
  games,
  userId,
}: {
  games: Game[];
  userId: string;
}) {
  const [picks, setPicks] = useState<Record<string | number, string>>({});
  const [lockedGameId, setLockedGameId] = useState<string | number | null>(null);
  const [savingGame, setSavingGame] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  // Load existing picks & user lock
  useEffect(() => {
    async function loadPicks() {
      if (!userId) return;

      const { data, error } = await supabase
        .from("picks")
        .select("game_id, picked_team, is_lock")
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading picks:", error);
        return;
      }

      const savedPicks: Record<string | number, string> = {};
      let currentLock: string | number | null = null;

      (data as Pick[] | null)?.forEach((pick: Pick) => {
        savedPicks[pick.game_id] = pick.picked_team;
        if (pick.is_lock) {
          currentLock = pick.game_id;
        }
      });

      setPicks(savedPicks);
      setLockedGameId(currentLock);
    }

    loadPicks();
  }, [userId]);

  // Handle Team Pick
  async function makePick(game: Game, team: string) {
    if (!userId) {
      setMessage("Please log in to make a pick.");
      return;
    }

    const isGameLocked = new Date(game.game_time).getTime() <= Date.now();
    if (isGameLocked) return;

    setSavingGame(game.id);
    setMessage("");

    const isCurrentLock = lockedGameId === game.id;

    const { error } = await supabase.from("picks").upsert(
      {
        user_id: userId,
        game_id: game.id,
        picked_team: team,
        is_lock: isCurrentLock,
      },
      { onConflict: "user_id,game_id" }
    );

    if (error) {
      console.error("Error saving pick:", error);
      setMessage(`Could not save pick: ${error.message}`);
      setSavingGame(null);
      return;
    }

    setPicks((current) => ({ ...current, [game.id]: team }));
    setMessage("Pick saved!");
    setSavingGame(null);
  }

  // Handle Setting / Switching Lock of the Week
  async function toggleLock(gameId: string | number) {
    if (!userId) return;

    // Must make a pick first before locking
    if (!picks[gameId]) {
      setMessage("Please pick a team for this game before setting it as your Lock.");
      return;
    }

    setSavingGame(gameId);
    setMessage("");

    // 1. Unset existing lock in DB if switching locks
    if (lockedGameId && lockedGameId !== gameId) {
      await supabase
        .from("picks")
        .update({ is_lock: false })
        .eq("user_id", userId)
        .eq("game_id", lockedGameId);
    }

    const isAlreadyLock = lockedGameId === gameId;
    const newLockState = !isAlreadyLock;

    // 2. Set new lock state in DB
    const { error } = await supabase
      .from("picks")
      .update({ is_lock: newLockState })
      .eq("user_id", userId)
      .eq("game_id", gameId);

    if (error) {
      setMessage("Could not update Lock of the Week.");
    } else {
      setLockedGameId(newLockState ? gameId : null);
      setMessage(newLockState ? "⭐ Lock of the Week set!" : "Lock removed.");
    }

    setSavingGame(null);
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {games?.map((game: Game) => {
        const selectedTeam = picks[game.id];
        const isLockOf = lockedGameId === game.id;
        const isGameLocked = new Date(game.game_time).getTime() <= Date.now();
        const isSaving = savingGame === game.id;

        const homeSpread = game.spread;
        const awaySpread = game.spread !== null ? -game.spread : null;

        return (
          <div
            key={game.id}
            className={`rounded-xl border p-6 transition ${
              isLockOf
                ? "border-amber-500/50 bg-slate-900/90 shadow-lg shadow-amber-500/5"
                : "border-slate-800 bg-slate-900"
            }`}
          >
            {/* Top Bar */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {new Date(game.game_time).toLocaleDateString([], {
                  month: "numeric",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                {new Date(game.game_time).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>

              <div className="flex items-center gap-2">
                {/* Lock of the Week Button */}
                {selectedTeam && !isGameLocked && (
                  <button
                    onClick={() => toggleLock(game.id)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      isLockOf
                        ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                        : "border border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    }`}
                  >
                    {isLockOf ? "🔒 LOCK OF THE WEEK" : "⭐ Set as Lock"}
                  </button>
                )}

                {isGameLocked && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-400">
                    🔒 Picks Locked
                  </span>
                )}
              </div>
            </div>

            {/* Matchup Selection Cards */}
            <div className="grid gap-3 md:grid-cols-2">
              {/* Away Team */}
              <button
                disabled={isGameLocked || isSaving}
                onClick={() => makePick(game, game.away_team)}
                className={`rounded-lg border p-5 text-left transition ${
                  selectedTeam === game.away_team
                    ? "border-blue-500 bg-blue-500/20"
                    : isGameLocked
                    ? "cursor-not-allowed border-slate-800 bg-slate-900 opacity-50"
                    : "border-slate-700 bg-slate-800 hover:border-blue-500 hover:bg-slate-700"
                }`}
              >
                <span className="text-xs uppercase text-slate-500">Away</span>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-white">
                    {game.away_team}
                  </span>
                  {awaySpread !== null && (
                    <span className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 text-sm font-extrabold text-blue-400">
                      {formatSpread(awaySpread)}
                    </span>
                  )}
                </div>
                {selectedTeam === game.away_team && (
                  <div className="mt-2 text-sm font-semibold text-blue-400">
                    ✓ Your Pick {isLockOf && "⭐ (LOCK)"}
                  </div>
                )}
              </button>

              {/* Home Team */}
              <button
                disabled={isGameLocked || isSaving}
                onClick={() => makePick(game, game.home_team)}
                className={`rounded-lg border p-5 text-left transition ${
                  selectedTeam === game.home_team
                    ? "border-blue-500 bg-blue-500/20"
                    : isGameLocked
                    ? "cursor-not-allowed border-slate-800 bg-slate-900 opacity-50"
                    : "border-slate-700 bg-slate-800 hover:border-blue-500 hover:bg-slate-700"
                }`}
              >
                <span className="text-xs uppercase text-slate-500">Home</span>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-lg font-bold text-white">
                    {game.home_team}
                  </span>
                  {homeSpread !== null && (
                    <span className="rounded border border-slate-800 bg-slate-950 px-2.5 py-1 text-sm font-extrabold text-blue-400">
                      {formatSpread(homeSpread)}
                    </span>
                  )}
                </div>
                {selectedTeam === game.home_team && (
                  <div className="mt-2 text-sm font-semibold text-blue-400">
                    ✓ Your Pick {isLockOf && "⭐ (LOCK)"}
                  </div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}