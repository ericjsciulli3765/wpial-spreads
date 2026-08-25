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

  const currentWeek = searchParams.get("week") ?? weeks[0]?.id;

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const weekId = event.target.value;

    router.push(`/leaderboard?week=${weekId}`);
  }

  return (
    <select
      value={currentWeek}
      onChange={handleChange}
      className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
    >
      {weeks.map((week) => (
        <option key={week.id} value={week.id}>
          {week.name}
        </option>
      ))}
    </select>
  );
}