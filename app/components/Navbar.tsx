"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Get current active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
    });

    // 2. Listen for real-time auth status changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { name: "Weekly Picks", href: "/" },
    { name: "Leaderboard", href: "/leaderboard" },
    { name: "Rankings Room", href: "/rankings" },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Left Side: Brand Header */}
        <div>
          <Link href="/" className="text-xl font-bold text-white hover:text-slate-200">
            2026 WPIAL Spreads Spread Picks
          </Link>
          <p className="text-xs text-slate-400">
            Pick the winners against the spread
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition ${
                  isActive
                    ? "text-blue-400"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Logged-in User Email & Sign Out Button */}
        {userEmail && (
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-slate-400">
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      {/* Mobile Sub-Navigation Links */}
      <div className="flex justify-around border-t border-slate-800 bg-slate-950 px-4 py-2 md:hidden">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-semibold transition ${
                isActive ? "text-blue-400" : "text-slate-400 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}