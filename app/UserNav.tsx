"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UserNav() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Get initial session state
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // If no user is logged in, hide the button completely
  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
    >
      Log Out
    </button>
  );
}