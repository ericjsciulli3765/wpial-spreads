import { supabase } from "@/lib/supabase";

export const revalidate = 0; // Force Next.js to fetch updated leaderboard data on every page view

type PickItem = {
  picked_team: string;
  is_lock?: boolean;
  game_id: number | string;
};

type GameItem = {
  id: number | string;
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

export default async function LeaderboardPage() {
  // 1. Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, is_hidden");

  // 2. Fetch games
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("id, away_team, home_team, spread, away_score, home_score");

  // 3. Fetch picks
  const { data: picks, error: picksError } = await supabase
    .from("picks")
    .select("user_id, game_id, picked_team, is_lock");

  if (profilesError || gamesError || picksError) {
    const errorMsg =
      profilesError?.message || gamesError?.message || picksError?.message;
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Leaderboard Error</h1>
        <p className="mt-4 text-red-400">{errorMsg}</p>
      </main>
    );
  }

  // Pre-calculate spread winners
  const gameWinners: Record<string | number, string | "PUSH" | null> = {};

  (games as GameItem[] | null)?.forEach((game) => {
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

  // Calculate user standings
  const standings = (profiles as ProfileItem[] | null)
    ?.filter((p) => !p.is_hidden)
    .map((profile) => {
      const userPicks = (picks as (PickItem & { user_id: string })[] | null)?.filter(
        (pk) => pk.user_id === profile.id
      );

      let wins = 0;
      let losses = 0;

      userPicks?.forEach((pick) => {
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
    .sort((a, b) => b.wins - a.wins || b.winning_percentage - a.winning_percentage);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            2026 Season
          </p>
          <h2 className="mt-2 text-4xl font-bold">Leaderboard</h2>
          <p className="mt-2 text-slate-400">
            See how everyone is doing against the spread. (⭐ Lock wins count as 2)
          </p>
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