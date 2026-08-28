"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 1. Initial auth check
    async function initAuth() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserEmail(user.email ?? null);
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          setUserEmail(session?.user?.email ?? null);
        }
      } catch (err) {
        console.error("Auth check error:", err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    // 2. Real-time auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setLoading(false);
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
          <Link
            href="/"
            className="text-xl font-bold text-white hover:text-slate-200"
          >
            2026 WPIAL Spreads Spread Picks
          </Link>
          <p className="text-xs text-slate-400">
            Pick the winners against the spread
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
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

        {/* Right Side: User Email & Sign Out Button */}
        {!loading && userEmail && (
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-slate-400 sm:inline">
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
    </header>
  );
}