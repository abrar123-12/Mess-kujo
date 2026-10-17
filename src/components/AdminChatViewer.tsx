"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AdminConversationPreview,
  ChatMessage,
  UserReport,
} from "@/lib/types";

function bnDate(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: "⏳ অপেক্ষমাণ",
  reviewed: "✅ দেখা হয়েছে",
  dismissed: "🚫 বাতিল",
};

export default function AdminChatViewer() {
  const supabase = createClient();
  const [sub, setSub] = useState<"chats" | "reports">("chats");
  const [loading, setLoading] = useState(true);
  const [convs, setConvs] = useState<AdminConversationPreview[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase
          .from("conversations")
          .select("*, listings(title)")
          .order("last_message_at", { ascending: false })
          .limit(100),
        supabase
          .from("user_reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
      const list = ((c as unknown[]) || []) as (AdminConversationPreview & {
        listings: { title: string } | null;
      })[];
      const enriched: AdminConversationPreview[] = await Promise.all(
        list.map(async (x) => {
          const [renter, owner, lastMsg, cnt] = await Promise.all([
            supabase
              .from("profiles")
              .select("name")
              .eq("id", x.renter_id)
              .maybeSingle(),
            supabase
              .from("profiles")
              .select("name")
              .eq("id", x.owner_id)
              .maybeSingle(),
            supabase
              .from("messages")
              .select("body,image_url")
              .eq("conversation_id", x.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", x.id),
          ]);
          return {
            ...x,
            listing_title: x.listings?.title || "বিজ্ঞাপন",
            renter_name:
              (renter.data as { name: string | null } | null)?.name || null,
            owner_name:
              (owner.data as { name: string | null } | null)?.name || null,
            last_message_body:
              (lastMsg.data as { body: string; image_url: string | null } | null)?.image_url
                ? "📷 ছবি পাঠানো হয়েছে"
                : (lastMsg.data as { body: string } | null)?.body || null,
            message_count: cnt.count || 0,
          };
        })
      );
      setConvs(enriched);
      // রিপোর্টার/অভিযুক্তের নাম-ফোন এক query-তে
      const rawReports = ((r as unknown[]) || []) as UserReport[];
      const ids = Array.from(
        new Set(rawReports.flatMap((x) => [x.reporter_id, x.reported_user_id]))
      );
      let nameMap: Record<string, { name: string | null; phone: string | null }> =
        {};
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,name,phone")
          .in("id", ids);
        ((profs as unknown[]) || []).forEach((p) => {
          const pr = p as { id: string; name: string | null; phone: string | null };
          nameMap[pr.id] = { name: pr.name, phone: pr.phone };
        });
      }
      setReports(
        rawReports.map((x) => ({
          ...x,
          reporter: nameMap[x.reporter_id] || null,
          reported: nameMap[x.reported_user_id] || null,
        }))
      );
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openThread = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    setThreadLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(300);
    setThread((data as ChatMessage[]) || []);
    setThreadLoading(false);
  };

  const setReportStatus = async (
    id: string,
    status: "reviewed" | "dismissed"
  ) => {
    setBusyId(id);
    const { error } = await supabase
      .from("user_reports")
      .update({ status })
      .eq("id", id);
    setBusyId(null);
    if (!error) {
      setReports((rs) =>
        rs.map((x) => (x.id === id ? { ...x, status } : x))
      );
    }
  };

  const subBtn = (s: "chats" | "reports", label: string) => (
    <button
      key={s}
      onClick={() => setSub(s)}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${
        sub === s
          ? "bg-slate-800 text-white"
          : "border border-slate-200 bg-white text-slate-600"
      }`}
    >
      {label}
    </button>
  );

  if (loading) {
    return <p className="py-6 text-center text-slate-500">লোড হচ্ছে...</p>;
  }

  return (
    <div>
      <div className="mb-3 flex gap-2">
        {subBtn("chats", `💬 সব চ্যাট (${convs.length})`)}
        {subBtn(
          "reports",
          `🚩 রিপোর্ট (${reports.filter((r) => r.status === "pending").length})`
        )}
      </div>

      {sub === "chats" ? (
        convs.length === 0 ? (
          <div className="card p-8 text-center text-slate-500">
            এখনো কোনো চ্যাট হয়নি
          </div>
        ) : (
          <div className="space-y-2">
            {convs.map((c) => (
              <div key={c.id} className="card">
                <button
                  onClick={() => openThread(c.id)}
                  className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-lg">
                    💬
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      🏠 {c.listing_title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      🙋 {c.renter_name || "ভাড়াটিয়া"} ↔ 🧑‍💼{" "}
                      {c.owner_name || "মালিক"} • {c.message_count} মেসেজ
                    </p>
                    {c.last_message_body && (
                      <p className="truncate text-sm text-slate-600">
                        {c.last_message_body}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {bnDate(c.last_message_at)}
                  </span>
                </button>
                {openId === c.id && (
                  <div className="border-t border-slate-100 bg-slate-50 p-3">
                    {threadLoading ? (
                      <p className="text-center text-sm text-slate-500">
                        লোড হচ্ছে...
                      </p>
                    ) : thread.length === 0 ? (
                      <p className="text-center text-sm text-slate-500">
                        মেসেজ নেই
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {thread.map((m) => {
                          const isRenter = m.sender_id === c.renter_id;
                          return (
                            <div
                              key={m.id}
                              className={`flex ${
                                isRenter ? "justify-start" : "justify-end"
                              }`}
                            >
                              <div
                                className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${
                                  isRenter
                                    ? "bg-white border border-slate-200"
                                    : "bg-sky-100"
                                }`}
                              >
                                <p className="text-[11px] font-bold text-slate-500">
                                  {isRenter
                                    ? `🙋 ${c.renter_name || "ভাড়াটিয়া"}`
                                    : `🧑‍💼 ${c.owner_name || "মালিক"}`}
                                </p>
                                {(m as { image_url?: string | null }).image_url && (
                                  <a
                                    href={(m as { image_url?: string | null }).image_url!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={(m as { image_url?: string | null }).image_url!}
                                      alt="চ্যাটের ছবি"
                                      className="mb-1 max-h-48 rounded-lg object-cover"
                                      loading="lazy"
                                    />
                                  </a>
                                )}
                                {m.body && (
                                  <p className="whitespace-pre-wrap break-words">
                                    {m.body}
                                  </p>
                                )}
                                <p className="text-right text-[10px] text-slate-400">
                                  {bnDate(m.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-2 text-center text-xs text-slate-400">
                      👁️ শুধু দেখা যাবে — অ্যাডমিন মেসেজ পাঠাতে পারবে না
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          কোনো রিপোর্ট নেই 🎉
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <div key={r.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    🚩 {r.reason}{" "}
                    <span
                      className={`badge ${
                        r.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : r.status === "reviewed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {REPORT_STATUS_LABEL[r.status]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    রিপোর্টার: {r.reporter?.name || "?"} (
                    {r.reporter?.phone || "?"}) → অভিযুক্ত:{" "}
                    {r.reported?.name || "?"} ({r.reported?.phone || "?"})
                  </p>
                  {r.details && (
                    <p className="mt-1 rounded bg-slate-50 p-2 text-sm text-slate-700">
                      "{r.details}"
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {bnDate(r.created_at)}
                  </p>
                </div>
              </div>
              {r.status === "pending" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setReportStatus(r.id, "reviewed")}
                    disabled={busyId === r.id}
                    className="btn-primary !px-3 !py-1.5 text-sm"
                  >
                    ✅ দেখেছি
                  </button>
                  <button
                    onClick={() => setReportStatus(r.id, "dismissed")}
                    disabled={busyId === r.id}
                    className="btn-secondary !px-3 !py-1.5 text-sm"
                  >
                    🚫 বাতিল
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
