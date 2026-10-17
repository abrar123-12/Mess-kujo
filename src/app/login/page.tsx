"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setError("❌ " + error.message);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">🔑 লগইন</h1>
        <p className="mt-1 text-sm text-slate-600">
          বিজ্ঞাপন দিতে ও যোগাযোগ করতে লগইন করুন
        </p>
        <form onSubmit={login} className="mt-4 space-y-3">
          <div>
            <label className="label">ইমেইল</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">পাসওয়ার্ড</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? "লগইন হচ্ছে..." : "লগইন"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          অ্যাকাউন্ট নেই?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-bold text-emerald-700 underline"
          >
            সাইন আপ করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center">লোড হচ্ছে...</p>}>
      <LoginForm />
    </Suspense>
  );
}
