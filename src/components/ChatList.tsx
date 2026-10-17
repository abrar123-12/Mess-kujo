"use client";

import Link from "next/link";
import type { ConversationPreview } from "@/lib/types";

function bnTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleString("bn-BD", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatList({
  conversations,
  currentUserId,
}: {
  conversations: ConversationPreview[];
  currentUserId: string;
}) {
  if (!conversations.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl">💬</p>
        <p className="mt-2 font-semibold">এখনো কোনো চ্যাট নেই</p>
        <p className="mt-1 text-sm text-slate-500">
          কোনো বিজ্ঞাপনে "💬 মালিকের সাথে চ্যাট" চাপলে এখানে দেখা যাবে
        </p>
        <Link href="/" className="btn-primary mt-4">
          🏠 বিজ্ঞাপন দেখুন
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((c) => {
        const preview = c.last_message_body
          ? c.last_message_sender_id === currentUserId
            ? `আপনি: ${c.last_message_body}`
            : c.last_message_body
          : "এখনো মেসেজ নেই — সালাম দিন! 👋";
        return (
          <Link
            key={c.id}
            href={`/chat/${c.id}`}
            className="card flex items-center gap-3 p-3 hover:bg-slate-50"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${
                c.is_owner ? "bg-amber-100" : "bg-emerald-100"
              }`}
            >
              {c.is_owner ? "🏠" : "🙋"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate font-bold">
                  {c.other_name || "ইউজার"}
                  {c.unread_count > 0 && (
                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {c.unread_count > 99 ? "৯৯+" : c.unread_count}
                    </span>
                  )}
                </p>
                <span className="shrink-0 text-xs text-slate-400">
                  {bnTime(c.last_message_created_at || c.last_message_at)}
                </span>
              </div>
              <p className="truncate text-xs text-slate-500">
                🏠 {c.listing_title}
                <span
                  className={`ml-1 badge ${
                    c.is_owner
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {c.is_owner ? "আপনার বিজ্ঞাপন" : "আপনি জিজ্ঞেস করেছেন"}
                </span>
              </p>
              <p
                className={`truncate text-sm ${
                  c.unread_count > 0
                    ? "font-semibold text-slate-800"
                    : "text-slate-500"
                }`}
              >
                {preview}
              </p>
            </div>
            {c.unread_count > 0 && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
