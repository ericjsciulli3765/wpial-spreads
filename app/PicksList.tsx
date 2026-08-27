"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import PickButton from "./components/PickButton";

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

export default function PicksList({
  games,
  userId,
}: {
  games: Game[];
  userId: string;
}) {
  const [picks, setPicks] = useState<Record<number, string>>({});
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

      const savedPicks: Record<number, string> = {};

      (data as Pick[] | null)?.forEach((pick) => {
        savedPicks[pick.game_id] = pick.picked_team;
      });

      setPicks(savedPicks);
    }

    loadPicks();
  }, [userId]);

  const handlePick = (gameId: number, team: string) => {
    setPicks((current) => ({
      ...current,
      [gameId]: team,
    }));
    setMessage("Pick saved!");
  };

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {games?.map((game) => {
        const selectedTeam = picks[game.id];
        const isLocked = new Date(game.game_time).getTime() <= Date.now();

        // Compute opposite spreads for home and away
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
              <PickButton
                gameId={game.id}
                team={game.away_team}
                label="Away"
                spread={awaySpread}
                selected={selectedTeam === game.away_team}
                onPick={(team) => handlePick(game.id, team)}
              />

              <PickButton
                gameId={game.id}
                team={game.home_team}
                label="Home"
                spread={homeSpread}
                selected={selectedTeam === game.home_team}
                onPick={(team) => handlePick(game.id, team)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}