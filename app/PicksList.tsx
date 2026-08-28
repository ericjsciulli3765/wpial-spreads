"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
};

// Helper function to handle signs (+ / -) cleanly
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
  const [savingGame, setSavingGame] = useState<string | number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPicks() {
      if (!userId) return;

      const { data, error } = await supabase
        .from("picks")
        .select("game_id, picked_team")
        .eq("user_id", userId);

      if (error) {
        console.error("Error loading picks:", error);
        return;
      }

      const savedPicks: Record<string | number, string> = {};

      (data as Pick[] | null)?.forEach((pick: Pick) => {
        savedPicks[pick.game_id] = pick.picked_team;
      });

      setPicks(savedPicks);
    }

    loadPicks();
  }, [userId]);

  async function makePick(game: Game, team: string) {
    if (!userId) {
      setMessage("Please log in to make a pick.");
      return;
    }

    const isLocked = new Date(game.game_time).getTime() <= Date.now();

    if (isLocked) {
      return;
    }

    setSavingGame(game.id);
    setMessage("");

    const { error } = await supabase.from("picks").upsert(
      {
        user_id: userId,
        game_id: game.id,
        picked_team: team,
      },
      {
        onConflict: "user_id,game_id",
      }
    );

    if (error) {
      console.error("Error saving pick:", error);
      setMessage(`Could not save pick: ${error.message}`);
      setSavingGame(null);
      return;
    }

    setPicks((current: Record<string | number, string>) => ({
      ...current,
      [game.id]: team,
    }));

    setMessage("Pick saved!");
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
        const isLocked = new Date(game.game_time).getTime() <= Date.now();
        const isSaving = savingGame === game.id;

        // Calculate dynamic spreads for both teams
        const homeSpread = game.spread;
        const awaySpread = game.spread !== null ? -game.spread : null;

        return (
          <div
            key={game.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
            {/* Top Bar: Kickoff time & Lock status only */}
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

              {isLocked && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-400">
                  🔒 Picks Locked
                </span>
              )}
            </div>

            {/* Matchup Selection Cards */}
            <div className="grid gap-3 md:grid-cols-2">
              {/* Away Team Button */}
              <button
                disabled={isLocked || isSaving}
                onClick={() => makePick(game, game.away_team)}
                className={`rounded-lg border p-5 text-left transition ${
                  selectedTeam === game.away_team
                    ? "border-blue-500 bg-blue-500/20"
                    : isLocked
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
                    <span className="rounded bg-slate-950 px-2.5 py-1 text-sm font-extrabold text-blue-400 border border-slate-800">
                      {formatSpread(awaySpread)}
                    </span>
                  )}
                </div>

                {selectedTeam === game.away_team && (
                  <div className="mt-2 text-sm font-semibold text-blue-400">
                    ✓ Your Pick
                  </div>
                )}

                {isSaving && selectedTeam !== game.away_team && (
                  <div className="mt-2 text-sm text-slate-400">Saving...</div>
                )}
              </button>

              {/* Home Team Button */}
              <button
                disabled={isLocked || isSaving}
                onClick={() => makePick(game, game.home_team)}
                className={`rounded-lg border p-5 text-left transition ${
                  selectedTeam === game.home_team
                    ? "border-blue-500 bg-blue-500/20"
                    : isLocked
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
                    <span className="rounded bg-slate-950 px-2.5 py-1 text-sm font-extrabold text-blue-400 border border-slate-800">
                      {formatSpread(homeSpread)}
                    </span>
                  )}
                </div>

                {selectedTeam === game.home_team && (
                  <div className="mt-2 text-sm font-semibold text-blue-400">
                    ✓ Your Pick
                  </div>
                )}

                {isSaving && selectedTeam !== game.home_team && (
                  <div className="mt-2 text-sm text-slate-400">Saving...</div>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}