"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function UserNav() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
    }

    getUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="flex items-center gap-4">
      {email && (
        <span className="hidden text-sm text-slate-400 sm:block">
          {email}
        </span>
      )}

      <button
        onClick={handleLogout}
        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
      >
        Log Out
      </button>
    </div>
  );
}