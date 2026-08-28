"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage(
          "Account created! Check your email to confirm your account."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">
            2026 WPIAL Spreads Spread Picks
          </h1>

          <p className="mt-2 text-slate-400">
            {isSignup ? "Create your account" : "Log in to make your picks"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-800 bg-slate-900 p-6"
        >
          <label className="block text-sm font-medium text-slate-300">
            Email
          </label>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="you@example.com"
          />

          <label className="mt-5 block text-sm font-medium text-slate-300">
            Password
          </label>

          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Account"
              : "Log In"}
          </button>

          {message && (
            <p className="mt-4 text-center text-sm text-slate-300">
              {message}
            </p>
          )}
        </form>

        <button
          onClick={() => {
            setIsSignup(!isSignup);
            setMessage("");
          }}
          className="mt-6 w-full text-center text-sm text-blue-400 hover:text-blue-300"
        >
          {isSignup
            ? "Already have an account? Log in"
            : "Need an account? Sign up"}
        </button>
      </div>
    </main>
  );
}