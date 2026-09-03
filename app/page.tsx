import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PicksList from "./PicksList";

export const revalidate = 0; // Dynamic fetch on every load

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get week number from search params, default to Week 2
  const resolvedParams = await searchParams;
  const targetWeekNum = resolvedParams.week ? parseInt(resolvedParams.week) : 2;

  // 1. Fetch all available weeks for navigation buttons
  const { data: allWeeks } = await supabase
    .from("weeks")
    .select("id, week_number, name")
    .eq("season", 2026)
    .order("week_number", { ascending: true });

  // 2. Fetch the target week
  const { data: week, error: weekError } = await supabase
    .from("weeks")
    .select("id, season, week_number, name")
    .eq("season", 2026)
    .eq("week_number", targetWeekNum)
    .single();

  if (weekError || !week) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Week Error</h1>
        <p className="mt-4 text-red-400">
          {weekError?.message ?? `Week ${targetWeekNum} could not be found.`}
        </p>
      </main>
    );
  }

  // 3. Fetch games for selected week
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*")
    .eq("week_id", week.id)
    .order("game_time", { ascending: true });

  if (gamesError) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Database Error</h1>
        <p className="mt-4 text-red-400">{gamesError.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
              {week.season} Season
            </p>
            <h2 className="mt-2 text-4xl font-bold">{week.name}</h2>
            <p className="mt-2 text-slate-400">
              Make your picks before kickoff.
            </p>
          </div>

          {/* Week Navigation Header */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
            <span className="text-sm font-semibold text-slate-400">Week:</span>
            <div className="flex gap-1">
              {allWeeks?.map((w) => (
                <a
                  key={w.id}
                  href={`/?week=${w.week_number}`}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    w.week_number === week.week_number
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  W{w.week_number}
                </a>
              ))}
            </div>
          </div>
        </div>

        <PicksList games={games ?? []} userId={user.id} />
      </section>
    </main>
  );
}