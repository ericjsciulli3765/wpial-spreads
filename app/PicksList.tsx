"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Game = {
  id: number;
  away_team: string;
  home_team: string;
  spread: number | null;
  game_time: string;
};

type Pick = {
  game_id: number;
  picked_team: string;
};

export default function PicksList({ games }: { games: Game[] }) {
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [savingGame, setSavingGame] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadPicks() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from("picks")
        .select("game_id, picked_team")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading picks:", error);
        return;
      }

      const savedPicks: Record<number, string> = {};

      (data as Pick[] | null)?.forEach((pick) => {
        savedPicks[pick.game_id] = pick.picked_team;
      });

      setPicks(savedPicks);
    }

    loadPicks();
  }, []);

  async function makePick(game: Game, team: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please log in to make a pick.");
      return;
    }

    const isLocked =
      new Date(game.game_time).getTime() <= Date.now();

    if (isLocked) {
      return;
    }

    setSavingGame(game.id);
    setMessage("");

    const { error } = await supabase
      .from("picks")
      .upsert(
        {
          user_id: user.id,
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

    setPicks((current) => ({
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

      {games?.map((game) => {
        const selectedTeam = picks[game.id];

        const isLocked =
          new Date(game.game_time).getTime() <= Date.now();

        const isSaving = savingGame === game.id;

        return (
          <div
            key={game.id}
            className="rounded-xl border border-slate-800 bg-slate-900 p-6"
          >
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

              {isLocked ? (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-slate-400">
                  🔒 Picks Locked
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-medium text-blue-400">
                  {game.home_team}{" "}
                  {game.spread != null && (
                    <>
                      {game.spread > 0 ? "+" : ""}
                      {game.spread}
                    </>
                  )}
                </span>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
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
                <span className="text-xs uppercase text-slate-500">
                  Away
                </span>

                <div className="mt-1 text-lg font-bold">
                  {game.away_team}
                </div>

                {selectedTeam === game.away_team && (
                  <div className="mt-2 text-sm font-semibold text-blue-400">
                    ✓ Your Pick
                  </div>
                )}

                {isSaving && selectedTeam !== game.away_team && (
                  <div className="mt-2 text-sm text-slate-400">
                    Saving...
                  </div>
                )}
              </button>

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
                <span className="text-xs uppercase text-slate-500">
                  Home
                </span>

                <div className="mt-1 text-lg font-bold">
                  {game.home_team}
                </div>

                {selectedTeam === game.home_team && (
                  <div className="mt-2 text-sm font-semibold text-blue-400">
                    ✓ Your Pick
                  </div>
                )}

                {isSaving && selectedTeam !== game.home_team && (
                  <div className="mt-2 text-sm text-slate-400">
                    Saving...
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