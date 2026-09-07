"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PickItem = {
  picked_team: string;
  is_lock?: boolean;
  game_id: number | string;
  user_id: string;
};

type GameItem = {
  id: number | string;
  week: number;
  away_team: string;
  home_team: string;
  spread: number | null;
  away_score: number | null;
  home_score: number | null;
};

type ProfileItem = {
  id: string;
  display_name: string | null;
  is_hidden?: boolean;
};

export default function LeaderboardPage() {
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [picks, setPicks] = useState<PickItem[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [profilesRes, gamesRes, picksRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, is_hidden"),
        supabase
          .from("games")
          .select("id, week, away_team, home_team, spread, away_score, home_score"),
        supabase.from("picks").select("user_id, game_id, picked_team, is_lock"),
      ]);

      if (profilesRes.error || gamesRes.error || picksRes.error) {
        setErrorMsg(
          profilesRes.error?.message ||
            gamesRes.error?.message ||
            picksRes.error?.message ||
            "Error loading leaderboard data."
        );
        setLoading(false);
        return;
      }

      const fetchedGames = (gamesRes.data as GameItem[]) || [];
      setProfiles((profilesRes.data as ProfileItem[]) || []);
      setGames(fetchedGames);
      setPicks((picksRes.data as PickItem[]) || []);

      // Extract unique week numbers dynamically and sort them
      const uniqueWeeks = Array.from(
        new Set(fetchedGames.map((g) => g.week).filter(Boolean))
      ).sort((a, b) => a - b);

      setWeeks(uniqueWeeks);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-10 text-white">
        <p className="font-medium text-slate-400">Loading standings...</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Leaderboard Error</h1>
        <p className="mt-4 text-red-400">{errorMsg}</p>
      </main>
    );
  }

  // Filter games based on dropdown selection
  const filteredGames =
    selectedWeek === "ALL"
      ? games
      : games.filter((g) => Number(g.week) === Number(selectedWeek));

  // Pre-calculate spread winners for filtered games
  const gameWinners: Record<string | number, string | "PUSH" | null> = {};

  filteredGames.forEach((game) => {
    if (game.away_score !== null && game.home_score !== null) {
      const spread = game.spread ?? 0;
      const homeTotal = game.home_score + spread;
      if (homeTotal > game.away_score) {
        gameWinners[game.id] = game.home_team;
      } else if (homeTotal < game.away_score) {
        gameWinners[game.id] = game.away_team;
      } else {
        gameWinners[game.id] = "PUSH";
      }
    } else {
      gameWinners[game.id] = null;
    }
  });

  // Force String IDs in Set to guarantee exact type matching across string/number IDs
  const validGameIds = new Set(filteredGames.map((g) => String(g.id)));

  const standings = profiles
    .filter((p) => !p.is_hidden)
    .map((profile) => {
      // Get user picks ONLY for games in the active week filter
      const userPicks = picks.filter(
        (pk) =>
          pk.user_id === profile.id && validGameIds.has(String(pk.game_id))
      );

      let wins = 0;
      let losses = 0;

      userPicks.forEach((pick) => {
        const winner = gameWinners[pick.game_id];
        if (winner && winner !== "PUSH") {
          if (pick.picked_team === winner) {
            wins += pick.is_lock ? 2 : 1;
          } else {
            losses += 1;
          }
        }
      });

      const totalDecisions = wins + losses;
      const winningPercentage =
        totalDecisions > 0 ? (wins / totalDecisions) * 100 : 0;

      return {
        user_id: profile.id,
        display_name: profile.display_name || "Anonymous",
        wins,
        losses,
        winning_percentage: winningPercentage,
      };
    })
    .sort(
      (a, b) => b.wins - a.wins || b.winning_percentage - a.winning_percentage
    );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              2026 Season
            </p>
            <h2 className="mt-2 text-4xl font-bold">Leaderboard</h2>
            <p className="mt-2 text-slate-400">
              See how everyone is doing against the spread. (⭐ Lock wins count as 2)
            </p>
          </div>

          {/* Week Filter Dropdown */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-2">
            <label
              htmlFor="week-select"
              className="pl-2 text-sm font-medium text-slate-400"
            >
              Filter:
            </label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Season Total</option>
              {weeks.map((weekNum) => (
                <option key={weekNum} value={weekNum}>
                  Week {weekNum}
                </option>
              ))}
            </select>
          </div>
        </div>

        {standings && standings.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="grid grid-cols-12 border-b border-slate-800 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-center">Wins</div>
              <div className="col-span-2 text-center">Losses</div>
              <div className="col-span-2 text-right">Win %</div>
            </div>

            {standings.map((player, index) => (
              <div
                key={player.user_id}
                className="grid grid-cols-12 items-center border-b border-slate-800 px-6 py-5 last:border-b-0"
              >
                <div className="col-span-1 text-lg font-bold text-slate-400">
                  {index + 1}
                </div>
                <div className="col-span-5 font-semibold">
                  {player.display_name}
                </div>
                <div className="col-span-2 text-center font-semibold text-emerald-400">
                  {player.wins}
                </div>
                <div className="col-span-2 text-center text-slate-400">
                  {player.losses}
                </div>
                <div className="col-span-2 text-right font-bold text-blue-400">
                  {player.winning_percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h3 className="text-xl font-semibold">No standings yet</h3>
            <p className="mt-2 text-slate-400">
              The leaderboard will appear here once games are completed.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}