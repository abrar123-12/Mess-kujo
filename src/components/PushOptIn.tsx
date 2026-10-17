"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DISMISS_KEY = "push-optin-dismissed";

// base64 VAPID key → Uint8Array (PushManager-এর জন্য)
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushOptIn() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const check = async () => {
      // ১. আগেই dismiss করেছে?
      if (localStorage.getItem(DISMISS_KEY)) return;
      // ২. ব্রাউজার সাপোর্ট করে?
      if (!("serviceWorker" in navigator) || !("PushManager" in window))
        return;
      // ৩. VAPID key বসানো আছে?
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      // ৪. লগইন করা আছে?
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // ৫. আগেই permission denied?
      if (Notification.permission === "denied") return;
      // ৬. আগেই subscribe করা আছে?
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) return;
        }
      } catch {
        /* ignore */
      }
      setVisible(true);
    };
    check();
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      // Service worker রেজিস্টার
      const reg = await navigator.serviceWorker.register("/sw.js");
      // Permission চাও
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        alert("🔕 নোটিফিকেশন বন্ধ রাখা হলো। পরে চাইলে ব্রাউজার সেটিংস থেকে চালু করতে পারবেন।");
        dismiss();
        return;
      }
      // Push subscribe
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as unknown as ArrayBuffer,
      });
      // সার্ভারে পাঠাও
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error("subscribe failed");
      alert("✅ চালু হয়েছে! নতুন নোটিশ এলে ফোনে পাবেন।");
      dismiss();
    } catch (e) {
      console.error(e);
      alert("❌ চালু করা যায়নি, আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
      <span className="text-2xl">🔔</span>
      <div className="flex-1">
        <p className="font-semibold text-emerald-900">
          নতুন মেসের খবর ফোনে পেতে চান?
        </p>
        <p className="text-sm text-emerald-700">
          নোটিশ এলে সাইট বন্ধ থাকলেও ফোনে নোটিফিকেশন আসবে।
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={enable}
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "⏳..." : "চালু করুন"}
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg border border-emerald-300 px-4 py-1.5 text-sm text-emerald-800"
          >
            পরে
          </button>
        </div>
      </div>
    </div>
  );
}
