import { supabase } from "@/lib/supabase";

export default async function LeaderboardPage() {
  const { data: standings, error } = await supabase
    .from("weekly_standings")
    .select("*")
    .order("winning_percentage", { ascending: false })
    .order("wins", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Leaderboard Error</h1>
        <p className="mt-4 text-red-400">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">


      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            2026 Season
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            Leaderboard
          </h2>

          <p className="mt-2 text-slate-400">
            See how everyone is doing against the spread.
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
                key={`${player.user_id}-${player.week_id}`}
                className="grid grid-cols-12 items-center border-b border-slate-800 px-6 py-5 last:border-b-0"
              >
                <div className="col-span-1 text-lg font-bold text-slate-400">
                  {index + 1}
                </div>

                <div className="col-span-5 font-semibold">
                  {player.display_name || "Anonymous"}
                </div>

                <div className="col-span-2 text-center font-semibold">
                  {player.wins ?? 0}
                </div>

                <div className="col-span-2 text-center text-slate-400">
                  {player.losses ?? 0}
                </div>

                <div className="col-span-2 text-right font-bold text-blue-400">
                  {player.winning_percentage != null
                    ? `${Number(player.winning_percentage).toFixed(1)}%`
                    : "0.0%"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">
            <h3 className="text-xl font-semibold">
              No standings yet
            </h3>

            <p className="mt-2 text-slate-400">
              The leaderboard will appear here once Week 1 games are
              completed and results are calculated.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}