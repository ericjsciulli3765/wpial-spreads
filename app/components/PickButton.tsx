"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type PickButtonProps = {
  gameId: number;
  team: string;
  label: "Away" | "Home";
  spread: number | null;
  selected?: boolean;
  onPick?: (team: string) => void;
};

// Helper to format spread signs (+ / -) cleanly
function formatSpread(val: number | null) {
  if (val === null || val === undefined) return "";
  if (val > 0) return `+${val}`;
  return `${val}`;
}

export default function PickButton({
  gameId,
  team,
  label,
  spread,
  selected = false,
  onPick,
}: PickButtonProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function makePick() {
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Please log in before making a pick.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("picks").upsert(
      {
        user_id: user.id,
        game_id: gameId,
        picked_team: team,
      },
      {
        onConflict: "user_id,game_id",
      }
    );

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    onPick?.(team);
    setSaving(false);
  }

  return (
    <div>
      <button
        onClick={makePick}
        disabled={saving}
        className={`w-full rounded-lg border p-5 text-left transition ${
          selected
            ? "border-blue-500 bg-blue-600"
            : "border-slate-700 bg-slate-800 hover:border-blue-500 hover:bg-slate-700"
        }`}
      >
        <span className="text-xs uppercase text-slate-400">{label}</span>

        {/* Team Name + Bigger White Pill Badge */}
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-white">{team}</span>
          {spread !== null && (
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-base font-extrabold text-white border border-slate-700">
              {formatSpread(spread)}
            </span>
          )}
        </div>

        <div className="mt-2 text-sm text-slate-300">
          {saving
            ? "Saving..."
            : selected
            ? "✓ Your Pick"
            : "Pick this team"}
        </div>
      </button>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}