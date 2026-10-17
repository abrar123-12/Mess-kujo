"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

function bnDateTime(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NotificationBell({
  userId,
  variant,
}: {
  userId: string;
  variant: "desktop" | "mobile";
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const load = async () => {
    const [{ data: notifs }, { data: reads }] = await Promise.all([
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("notification_reads")
        .select("notification_id")
        .eq("user_id", userId),
    ]);
    setItems((notifs as Notification[]) || []);
    setReadIds(
      new Set(
        ((reads as { notification_id: string }[]) || []).map(
          (r) => r.notification_id
        )
      )
    );
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const unreadIds = items.filter((n) => !readIds.has(n.id)).map((n) => n.id);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
  };

  const markAllRead = async () => {
    if (!unreadIds.length) return;
    const rows = unreadIds.map((notification_id) => ({
      notification_id,
      user_id: userId,
    }));
    const { error } = await supabase.from("notification_reads").insert(rows);
    if (!error)
      setReadIds(new Set<string>([...Array.from(readIds), ...unreadIds]));
  };

  const markOneRead = async (id: string) => {
    if (readIds.has(id)) return;
    const { error } = await supabase
      .from("notification_reads")
      .insert({ notification_id: id, user_id: userId });
    if (!error) {
      const next = new Set<string>(Array.from(readIds));
      next.add(id);
      setReadIds(next);
    }
  };

  const badge =
    unreadIds.length > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
        {unreadIds.length > 99
          ? "৯৯+"
          : unreadIds.length.toLocaleString("bn-BD")}
      </span>
    ) : null;

  const panel = (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h3 className="font-bold">🔔 নোটিশ</h3>
        <div className="flex items-center gap-3">
          {unreadIds.length > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              সব পড়া হয়েছে ✓
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="বন্ধ করুন"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {items.map((n) => {
          const unread = !readIds.has(n.id);
          return (
            <button
              key={n.id}
              onClick={() => markOneRead(n.id)}
              className={`block w-full border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${
                unread ? "bg-amber-50" : ""
              }`}
            >
              <p className="flex items-center gap-1.5 text-sm font-bold">
                {unread && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600" />
                )}
                {n.title}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-slate-600">
                {n.message}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                🕒 {bnDateTime(n.created_at)}
              </p>
            </button>
          );
        })}
        {!items.length && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            🔔 এখনো কোনো নোটিশ নেই
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {variant === "desktop" ? (
        <div className="relative">
          <button
            onClick={toggle}
            aria-label="নোটিফিকেশন"
            title="নোটিশ"
            className="relative whitespace-nowrap rounded-lg px-3 py-1.5 text-xl hover:bg-emerald-600"
          >
            🔔{badge}
          </button>
          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-96 max-w-[calc(100vw-2rem)]">
              {panel}
            </div>
          )}
        </div>
      ) : (
        <>
          <button
            onClick={toggle}
            aria-label="নোটিশ"
            className="flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] leading-tight text-slate-500"
          >
            <span className="relative text-xl">🔔{badge}</span>
            <span>নোটিশ</span>
          </button>
          {open && (
            <div className="fixed inset-x-3 bottom-[76px] z-50">{panel}</div>
          )}
        </>
      )}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
