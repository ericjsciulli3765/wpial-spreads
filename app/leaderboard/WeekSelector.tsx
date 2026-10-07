"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Week = {
  id: string;
  season: number;
  week_number: number;
  name: string;
};

export default function WeekSelector({ weeks }: { weeks: Week[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default to active week or 'all'
  const currentWeek = searchParams.get("week") ?? String(weeks[0]?.week_number ?? "all");

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const weekValue = event.target.value;
    router.push(`/leaderboard?week=${weekValue}`);
  }

  return (
    <select
      value={currentWeek}
      onChange={handleChange}
      className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="all">All Weeks</option>
      {weeks.map((week) => (
        <option key={week.id} value={String(week.week_number)}>
          {week.name}
        </option>
      ))}
    </select>
  );
}