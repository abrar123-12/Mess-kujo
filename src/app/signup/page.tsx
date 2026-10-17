"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") || "/";

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (phone.replace(/\D/g, "").length < 11) {
      setError("❌ সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন");
      return;
    }
    if (password.length < 6) {
      setError("❌ পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), phone: phone.trim() } },
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
        <h1 className="text-2xl font-bold">📝 সাইন আপ</h1>
        <p className="mt-1 text-sm text-slate-600">
          ফ্রি অ্যাকাউন্ট খুলে বিজ্ঞাপন দিন
        </p>
        <form onSubmit={signup} className="mt-4 space-y-3">
          <div>
            <label className="label">আপনার নাম *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: রহিম উদ্দিন"
            />
          </div>
          <div>
            <label className="label">মোবাইল নম্বর *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <label className="label">ইমেইল *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">পাসওয়ার্ড * (কমপক্ষে ৬ অক্ষর)</label>
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
            {busy ? "অ্যাকাউন্ট হচ্ছে..." : "অ্যাকাউন্ট খুলুন"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          অ্যাকাউন্ট আছে?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="font-bold text-emerald-700 underline"
          >
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center">লোড হচ্ছে...</p>}>
      <SignupForm />
    </Suspense>
  );
}
