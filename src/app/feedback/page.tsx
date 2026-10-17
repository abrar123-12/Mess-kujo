"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { checkActiveUser, BANNED_MESSAGE } from "@/lib/requireActiveUser";

const TYPES = [
  { value: "feature", label: "💡 ফিচার রিকোয়েস্ট" },
  { value: "bug", label: "🐞 সমস্যা জানান" },
  { value: "opinion", label: "💬 মতামত" },
];

export default function FeedbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [type, setType] = useState("feature");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login?next=/feedback");
      } else {
        setUserId(data.user.id);
        setChecking(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (message.trim().length < 10) {
      setError("⚠️ মতামত কমপক্ষে ১০ অক্ষরের লিখুন");
      return;
    }
    setBusy(true);
    // স্থগিত অ্যাকাউন্ট ফিডব্যাক পাঠাতে পারবে না
    const active = await checkActiveUser(supabase);
    if (!active.ok) {
      setError(active.banned ? BANNED_MESSAGE : "❌ লগইন করুন");
      setBusy(false);
      if (active.banned) router.push("/");
      return;
    }
    const { error } = await supabase.from("feedback").insert({
      user_id: userId,
      type,
      message: message.trim(),
    });
    setBusy(false);
    if (error) {
      setError("❌ " + error.message);
      return;
    }
    setDone(true);
    setMessage("");
  };

  if (checking) {
    return <p className="py-16 text-center">লোড হচ্ছে...</p>;
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="card p-5">
        <h1 className="text-2xl font-bold">💬 ফিডব্যাক</h1>
        <p className="mt-1 text-sm text-slate-600">
          কোন ফিচার চান? কোথায় সমস্যা পেলেন? আমাদের জানান — আপনার মতামতেই
          অ্যাপ উন্নত হবে।
        </p>

        {done ? (
          <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-center">
            <p className="text-4xl">🙏</p>
            <p className="mt-2 font-bold text-emerald-800">
              ধন্যবাদ! আপনার মতামত পৌঁছেছে।
            </p>
            <p className="text-sm text-slate-600">
              আমরা শীঘ্রই এটি দেখবো ইনশাআল্লাহ।
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setDone(false)}
                className="btn-secondary !px-3 !py-1.5 text-sm"
              >
                ✍️ আরেকটি লিখুন
              </button>
              <Link href="/" className="btn-primary !px-3 !py-1.5 text-sm">
                🏠 হোমে ফিরুন
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <div>
              <label className="label">ধরন</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">আপনার মতামত *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="যেমন: ভাড়ার রেঞ্জ দিয়ে ফিল্টার করার অপশন চাই..."
                rows={5}
              />
              <p className="mt-1 text-xs text-slate-500">
                কমপক্ষে ১০ অক্ষর লিখুন ({message.trim().length}/১০)
              </p>
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "পাঠানো হচ্ছে..." : "📩 পাঠান"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
