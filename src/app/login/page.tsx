"use client";

import Link from "next/link";
import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Captcha, { CaptchaHandle } from "@/components/Captcha";
import { BANNED_MESSAGE } from "@/lib/requireActiveUser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const next = searchParams.get("next") || "/";
  const signedUp = searchParams.get("signed_up") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaTokenRef = useRef<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);

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

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    setBusy(false);
    if (error) {
      captchaRef.current?.reset();
      captchaTokenRef.current = null;
      setCaptchaToken(null);
      const msg = /captcha/i.test(error.message)
        ? "সিকিউরিটি যাচাই ব্যর্থ হয়েছে, আবার চেষ্টা করুন।"
        : error.message;
      setError("❌ " + msg);
      return;
    }
    // স্থগিত অ্যাকাউন্ট হলে ঢুকতে দিও না
    let role: "admin" | "user" = "user";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_banned, role")
        .eq("id", user.id)
        .maybeSingle();
      if (
        profile &&
        (profile as { is_banned: boolean }).is_banned
      ) {
        await supabase.auth.signOut();
        setError("❌ " + BANNED_MESSAGE);
        return;
      }
      if ((profile as { role: string } | null)?.role === "admin") {
        role = "admin";
      }
    }
    // রোল অনুযায়ী পাঠাও: অ্যাডমিন → /admin, ইউজার → /dashboard
    // next প্যারামিটার শুধু তখনই মানা হবে যখন ওই রোলের জন্য নিরাপদ
    let dest = role === "admin" ? "/admin" : "/dashboard";
    const rawNext = searchParams.get("next");
    if (rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")) {
      const isAdminPage = rawNext.startsWith("/admin");
      const isUserPage =
        rawNext.startsWith("/dashboard") || rawNext.startsWith("/post");
      const isAuthPage =
        rawNext.startsWith("/login") || rawNext.startsWith("/signup");
      const allowed =
        !isAuthPage &&
        (isAdminPage ? role === "admin" : isUserPage ? role === "user" : true);
      if (allowed) dest = rawNext;
    }
    router.push(dest);
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
          {signedUp && (
            <p className="rounded-lg bg-green-50 p-2 text-sm font-medium text-green-700">
              ✅ অ্যাকাউন্ট তৈরি হয়েছে! এবার লগইন করুন।
            </p>
          )}
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
          <Captcha ref={captchaRef} onVerify={handleVerify} />
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
