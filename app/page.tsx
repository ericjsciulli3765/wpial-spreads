import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PicksList from "./PicksList";

export const revalidate = 0; // Forces Next.js to dynamically fetch & render the page every request

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: week, error: weekError } = await supabase
    .from("weeks")
    .select("id, season, week_number, name")
    .eq("season", 2026)
    .eq("week_number", 1)
    .single();

  if (weekError || !week) {
    return (
      <main className="min-h-screen bg-slate-950 p-10 text-white">
        <h1 className="text-2xl font-bold">Week Error</h1>
        <p className="mt-4 text-red-400">
          {weekError?.message ?? "Week 1 could not be found."}
        </p>
      </main>
    );
  }

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
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
            {week.season} Season
          </p>

          <h2 className="mt-2 text-4xl font-bold">
            {week.name}
          </h2>

          <p className="mt-2 text-slate-400">
            Make your picks before kickoff.
          </p>
        </div>

        <PicksList games={games ?? []} userId={user.id} />
      </section>
    </main>
  );
}