'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Automatically fetch the logged-in user's email
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navLinks = [
    { name: 'Weekly Picks', href: '/' },
    { name: 'Leaderboard', href: '/leaderboard' },
    { name: 'Rankings Room', href: '/rankings' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Left Side: Brand Header */}
        <div>
          <Link href="/">
            <h1 className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
              2026 WPIAL Spreads Spread Picks
            </h1>
          </Link>
          <p className="text-xs text-slate-400">
            Pick the winners against the spread
          </p>
        </div>

        {/* Middle: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-blue-400 border-b-2 border-blue-400 pb-1'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: Logged-in User Email & Sign Out Button */}
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden sm:inline text-xs text-slate-400">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Navigation Links (Mobile sub-bar) */}
      <div className="flex md:hidden border-t border-slate-800 bg-slate-950 px-6 py-2.5 justify-around">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-semibold ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400'
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