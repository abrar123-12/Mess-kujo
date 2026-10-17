"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage } from "@/lib/types";
import { checkActiveUser, BANNED_MESSAGE } from "@/lib/requireActiveUser";

// রিপোর্টের কারণ
const REPORT_REASONS = [
  "প্রতারণা/স্ক্যাম",
  "অশালীন আচরণ",
  "ভুয়া তথ্য",
  "অন্যান্য",
];

function bnTime(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  otherUserId,
  otherName,
  listingTitle,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  otherUserId: string;
  otherName: string | null;
  listingTitle: string;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [realtimeOk, setRealtimeOk] = useState(false);
  const [msg, setMsg] = useState("");
  // রিপোর্ট শিট
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reported, setReported] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // নিচে স্ক্রল
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // পড়া হিসেবে চিহ্নিত করো
  const markRead = async () => {
    await supabase.from("conversation_reads").upsert(
      {
        conversation_id: conversationId,
        user_id: currentUserId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "conversation_id,user_id" }
    );
  };

  useEffect(() => {
    markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: নতুন মেসেজ লাইভ
  useEffect(() => {
    const ch = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
          markRead();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeOk(true);
      });
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ফলব্যাক: realtime না চললে ৫ সেকেন্ডে পোল
  const refresh = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) {
      setMessages(data as ChatMessage[]);
      markRead();
    }
  };

  useEffect(() => {
    if (realtimeOk) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeOk, conversationId]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setMsg("");
    const res = await checkActiveUser(supabase);
    if (!res.ok) {
      if (res.banned) {
        setMsg(BANNED_MESSAGE);
        return;
      }
      router.push("/login");
      return;
    }
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        body: body.slice(0, 2000),
      })
      .select("*")
      .single();
    setSending(false);
    if (error || !data) {
      setMsg("❌ মেসেজ যায়নি, আবার চেষ্টা করুন");
      return;
    }
    const m = data as ChatMessage;
    setMessages((prev) =>
      prev.some((x) => x.id === m.id) ? prev : [...prev, m]
    );
    setInput("");
    markRead();
  };

  const submitReport = async () => {
    setReportBusy(true);
    const { error } = await supabase.from("user_reports").insert({
      reporter_id: currentUserId,
      reported_user_id: otherUserId,
      conversation_id: conversationId,
      reason,
      details: details.trim() || null,
    });
    setReportBusy(false);
    if (error) {
      setMsg("❌ রিপোর্ট যায়নি, আবার চেষ্টা করুন");
      return;
    }
    setReported(true);
    setReportOpen(false);
    setDetails("");
    setMsg("✅ রিপোর্ট পাঠানো হয়েছে — অ্যাডমিন দেখবেন");
  };

  return (
    <div className="flex h-[calc(100dvh-220px)] min-h-[420px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:h-[calc(100dvh-260px)]">
      {/* হেডার */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-700 px-3 py-2.5 text-white">
        <button
          onClick={() => router.back()}
          aria-label="পেছনে যান"
          className="rounded-lg px-2 py-1 text-xl hover:bg-emerald-600"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">
            {otherName || "ইউজার"}
          </p>
          <p className="truncate text-xs text-emerald-100">
            🏠 {listingTitle}
          </p>
        </div>
        {!reported ? (
          <button
            onClick={() => setReportOpen(true)}
            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-sm font-semibold hover:bg-emerald-500"
          >
            🚩 রিপোর্ট
          </button>
        ) : (
          <span className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs">
            রিপোর্ট করা হয়েছে
          </span>
        )}
      </div>

      {/* মেসেজ */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-sm text-slate-500">
            <p className="text-4xl">💬</p>
            <p className="mt-2">
              সালাম দিন! ভাড়া, লোকেশন বা শর্ত নিয়ে জিজ্ঞেস করুন।
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-[15px] leading-snug ${
                  mine
                    ? "rounded-br-sm bg-emerald-600 text-white"
                    : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={`mt-0.5 text-right text-[11px] ${
                    mine ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  {bnTime(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {msg && (
        <p className="border-t border-slate-100 bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
          {msg}
        </p>
      )}

      {/* ইনপুট */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="মেসেজ লিখুন..."
          maxLength={2000}
          className="!py-2"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="btn-primary !px-4 !py-2 text-lg"
          aria-label="পাঠান"
        >
          {sending ? "…" : "➤"}
        </button>
      </div>

      {/* রিপোর্ট শিট */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 md:rounded-2xl">
            <h3 className="text-lg font-bold">🚩 ইউজার রিপোর্ট করুন</h3>
            <p className="mt-1 text-sm text-slate-600">
              "{otherName || "এই ইউজার"}"-এর বিরুদ্ধে রিপোর্ট — অ্যাডমিন
              দেখবেন।
            </p>
            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    reason === r
                      ? "border-red-500 bg-red-50 text-red-800"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="!w-auto"
                  />
                  {r}
                </label>
              ))}
            </div>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="বিস্তারিত লিখুন (ঐচ্ছিক)"
              rows={3}
              maxLength={1000}
              className="mt-3"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={submitReport}
                disabled={reportBusy}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {reportBusy ? "পাঠানো হচ্ছে..." : "🚩 রিপোর্ট পাঠান"}
              </button>
              <button
                onClick={() => setReportOpen(false)}
                disabled={reportBusy}
                className="btn-secondary"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
