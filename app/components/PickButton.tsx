"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PickButtonProps {
  gameId: string;
  teamPicked: string;
  selectedTeam: string | null;
  onPickSuccess: (team: string) => void;
}

export default function PickButton({
  gameId,
  teamPicked,
  selectedTeam,
  onPickSuccess,
}: PickButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePick = async () => {
    setLoading(true);
    setErrorMsg("");

    const supabase = createClient();

    // 1. Get the current authenticated user session directly
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setErrorMsg("Please log in before making a pick.");
      setLoading(false);
      return;
    }

    // 2. Save or update the pick in Supabase
    const { error } = await supabase.from("picks").upsert(
      {
        user_id: user.id,
        game_id: gameId,
        team_picked: teamPicked,
      },
      { onConflict: "user_id,game_id" }
    );

    if (error) {
      setErrorMsg("Failed to save pick. Try again.");
    } else {
      onPickSuccess(teamPicked);
    }

    setLoading(false);
  };

  const isSelected = selectedTeam === teamPicked;

  return (
    <div>
      <button
        onClick={handlePick}
        disabled={loading}
        className={`w-full rounded-xl p-4 text-left transition ${
          isSelected
            ? "bg-blue-600 text-white"
            : "bg-slate-800 text-slate-300 hover:bg-slate-750"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-bold">{teamPicked}</span>
          {isSelected && <span className="text-xs font-semibold">✓ Your Pick</span>}
        </div>
      </button>

      {errorMsg && (
        <p className="mt-2 text-xs text-red-500">{errorMsg}</p>
      )}
    </div>
  );
}