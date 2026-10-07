"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WeekSelector from "./WeekSelector";

type ProfileItem = {
  id: string;
  display_name: string;
  is_hidden?: boolean;
};

type GameItem = {
  id: string | number;
  week: string | number;
  away_team: string;
  home_team: string;
  spread: number;
  away_score: number | null;
  home_score: number | null;
};

type PickItem = {
  user_id: string;
  game_id: string | number;
  picked_team: string;
  is_lock?: boolean;
};

type StandingsRow = {
  profile_id: string;
  display_name: string;
  wins: number;
  losses: number;
  pushes: number;
  total_picks: number;
};

function LeaderboardContent() {
  const supabase = createClient();
  const searchParamsHook = useSearchParams();

  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [picks, setPicks] = useState<PickItem[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const activeWeekParam = searchParamsHook.get("week");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // 1. Fetch weeks, profiles, and games
      const [profilesRes, gamesRes, weeksRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, is_hidden"),
        supabase
          .from("games")
          .select("id, week, away_team, home_team, spread, away_score, home_score"),
        supabase.from("weeks").select("*").order("week_number", { ascending: true }),
      ]);

      const fetchedGames = (gamesRes.data as GameItem[]) || [];
      const fetchedProfiles = (profilesRes.data as ProfileItem[]) || [];

      setProfiles(fetchedProfiles);
      setGames(fetchedGames);

      let loadedWeeks = weeksRes.data || [];
      if (loadedWeeks.length === 0) {
        const uniqueWeeks = Array.from(
          new Set(
            fetchedGames
              .map((g) => parseInt(String(g.week), 10))
              .filter((w) => !isNaN(w))
          )
        ).sort((a, b) => a - b);

        loadedWeeks = uniqueWeeks.map((w) => ({
          id: String(w),
          week_number: w,
          name: `Week ${w}`,
        }));
      }
      setWeeks(loadedWeeks);

      // 2. Check if we are querying "all" weeks or a single week
      const isAllWeeks = !activeWeekParam || activeWeekParam === "all";

      let pickQuery = supabase
        .from("picks")
        .select("user_id, game_id, picked_team, is_lock");

      if (!isAllWeeks) {
        const selectedWeekNum = parseInt(activeWeekParam, 10);
        const weekGameIds = fetchedGames
          .filter((g) => parseInt(String(g.week), 10) === selectedWeekNum)
          .map((g) => g.id);

        if (weekGameIds.length > 0) {
          pickQuery = pickQuery.in("game_id", weekGameIds);
        } else {
          setPicks([]);
          setLoading(false);
          return;
        }
      } else {
        // Fetch up to 5000 rows when grabbing overall season picks
        pickQuery = pickQuery.range(0, 5000);
      }

      const { data: fetchedPicks } = await pickQuery;
      setPicks((fetchedPicks as PickItem[]) || []);
      setLoading(false);
    }

    fetchData();
  }, [activeWeekParam]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-lg">Loading leaderboard...</p>
      </div>
    );
  }

  const isAllWeeks = !activeWeekParam || activeWeekParam === "all";
  const selectedWeekNum = activeWeekParam ? parseInt(activeWeekParam, 10) : null;

  // Filter relevant games based on selected view
  const activeGames = isAllWeeks
    ? games
    : games.filter((g) => parseInt(String(g.week), 10) === selectedWeekNum);

  const gameMap = new Map<string, GameItem>();
  activeGames.forEach((g) => {
    gameMap.set(String(g.id), g);
  });

  const standings: StandingsRow[] = profiles
    .filter((p) => !p.is_hidden)
    .map((profile) => {
      let wins = 0;
      let losses = 0;
      let pushes = 0;
      let total_picks = 0;

      const userPicks = picks.filter(
        (p) =>
          String(p.user_id) === String(profile.id) &&
          gameMap.has(String(p.game_id))
      );

      total_picks = userPicks.length;

      userPicks.forEach((pick) => {
        const game = gameMap.get(String(pick.game_id));
        if (!game || game.home_score === null || game.away_score === null) {
          return;
        }

        const homeScore = Number(game.home_score);
        const awayScore = Number(game.away_score);
        const spread = Number(game.spread || 0);

        const homeAdjusted = homeScore + spread;

        let winningTeam = "";
        if (homeAdjusted > awayScore) {
          winningTeam = game.home_team;
        } else if (awayScore > homeAdjusted) {
          winningTeam = game.away_team;
        }

        if (!winningTeam) {
          pushes++;
        } else if (
          pick.picked_team.trim().toLowerCase() ===
          winningTeam.trim().toLowerCase()
        ) {
          wins++;
        } else {
          losses++;
        }
      });

      return {
        profile_id: profile.id,
        display_name: profile.display_name,
        wins,
        losses,
        pushes,
        total_picks,
      };
    })
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leaderboard</h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAllWeeks ? "Overall Season Standings" : `Week ${selectedWeekNum} Standings`}
            </p>
          </div>
          <WeekSelector weeks={weeks} />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full text-left">
            <thead className="border-b border-slate-800 bg-slate-800/50 text-slate-400">
              <tr>
                <th className="p-4">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4 text-center">W</th>
                <th className="p-4 text-center">L</th>
                <th className="p-4 text-center">P</th>
                <th className="p-4 text-center">Picks evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {standings.map((row, idx) => (
                <tr key={row.profile_id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-bold text-slate-500">
                    #{idx + 1}
                  </td>
                  <td className="p-4 font-medium">{row.display_name}</td>
                  <td className="p-4 text-center font-semibold text-emerald-400">
                    {row.wins}
                  </td>
                  <td className="p-4 text-center font-semibold text-rose-400">
                    {row.losses}
                  </td>
                  <td className="p-4 text-center font-semibold text-slate-400">
                    {row.pushes}
                  </td>
                  <td className="p-4 text-center font-mono text-sm text-slate-400">
                    {row.total_picks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p className="text-lg">Loading leaderboard...</p>
        </div>
      }
    >
      <LeaderboardContent />
    </Suspense>
  );
}