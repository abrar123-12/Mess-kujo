"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile, { TurnstileHandle } from "@/components/Turnstile";

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
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaTokenRef = useRef<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const handleVerify = (token: string | null) => {
    if (token === null && captchaTokenRef.current !== null) {
      // Token expired after being issued — user must verify again
      setError("❌ সিকিউরিটি যাচাই ব্যর্থ হয়েছে, আবার চেষ্টা করুন।");
    } else if (token !== null) {
      setError((e) => (e.includes("সিকিউরিটি যাচাই") ? "" : e));
    }
    captchaTokenRef.current = token;
    setCaptchaToken(token);
  };

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
      options: {
        data: { name: name.trim(), phone: phone.trim() },
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
    setBusy(false);
    if (error) {
      turnstileRef.current?.reset();
      captchaTokenRef.current = null;
      setCaptchaToken(null);
      const msg = /captcha/i.test(error.message)
        ? "সিকিউরিটি যাচাই ব্যর্থ হয়েছে, আবার চেষ্টা করুন।"
        : error.message;
      setError("❌ " + msg);
      return;
    }
    // Confirm-email OFF means signUp auto-logs-in — force logout so the
    // user must log in separately on the login page
    await supabase.auth.signOut();
    router.push(`/login?signed_up=1&next=${encodeURIComponent(next)}`);
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
          <Turnstile ref={turnstileRef} onVerify={handleVerify} />
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
