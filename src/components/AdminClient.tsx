"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Listing,
  Profile,
  Feedback,
  Inquiry,
  RentalFeedback,
} from "@/lib/types";
import { typeLabel, statusLabel } from "@/lib/data";

type Tab = "listings" | "users" | "feedback" | "inquiries" | "ratings";

function feedbackTypeLabel(t: string): string {
  if (t === "bug") return "🐞 সমস্যা";
  if (t === "opinion") return "💬 মতামত";
  return "💡 ফিচার রিকোয়েস্ট";
}

function bnDate(iso: string): string {
  return new Date(iso).toLocaleString("bn-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminClient({
  users,
  listings,
  feedback,
  inquiries,
  ratings,
}: {
  users: Profile[];
  listings: Listing[];
  feedback: Feedback[];
  inquiries: Inquiry[];
  ratings: RentalFeedback[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("listings");
  const [items, setItems] = useState(listings);
  const [busyId, setBusyId] = useState<string | null>(null);

  const feature = async (id: string) => {
    setBusyId(id);
    const until = new Date(Date.now() + 30 * 86400000).toISOString();
    await supabase
      .from("listings")
      .update({ is_featured: true, featured_until: until })
      .eq("id", id);
    setItems((it) =>
      it.map((l) =>
        l.id === id ? { ...l, is_featured: true, featured_until: until } : l
      )
    );
    setBusyId(null);
  };

  const unfeature = async (id: string) => {
    setBusyId(id);
    await supabase
      .from("listings")
      .update({ is_featured: false, featured_until: null })
      .eq("id", id);
    setItems((it) =>
      it.map((l) =>
        l.id === id ? { ...l, is_featured: false, featured_until: null } : l
      )
    );
    setBusyId(null);
  };

  const hide = async (id: string) => {
    if (!confirm("লিস্টিংটি হাইড করবেন? (মেয়াদ শেষ হিসেবে মার্ক হবে)")) return;
    setBusyId(id);
    await supabase.from("listings").update({ status: "expired" }).eq("id", id);
    setItems((it) =>
      it.map((l) => (l.id === id ? { ...l, status: "expired" } : l))
    );
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("লিস্টিংটি সম্পূর্ণ ডিলিট করবেন?")) return;
    setBusyId(id);
    await supabase.from("listings").delete().eq("id", id);
    setItems((it) => it.filter((l) => l.id !== id));
    setBusyId(null);
  };

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      onClick={() => setTab(t)}
      className={`rounded-lg px-4 py-2 font-semibold ${
        tab === t
          ? "bg-emerald-600 text-white"
          : "bg-white border border-slate-300"
      }`}
    >
      {label}
    </button>
  );

  // যোগাযোগ: প্রতি লিস্টিংয়ে মোট কতবার
  const inquiryCounts = inquiries.reduce<Record<string, { title: string; n: number }>>(
    (acc, q) => {
      const title = q.listings?.title || "ডিলিট হওয়া লিস্টিং";
      if (!acc[q.listing_id]) acc[q.listing_id] = { title, n: 0 };
      acc[q.listing_id].n += 1;
      return acc;
    },
    {}
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabBtn("listings", `🏠 লিস্টিং (${items.length})`)}
        {tabBtn("users", `👥 ইউজার (${users.length})`)}
        {tabBtn("feedback", `💬 ফিডব্যাক (${feedback.length})`)}
        {tabBtn("inquiries", `📞 যোগাযোগ (${inquiries.length})`)}
        {tabBtn("ratings", `⭐ রেটিং (${ratings.length})`)}
      </div>

      {tab === "users" && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-2">নাম</th>
                <th className="p-2">ফোন</th>
                <th className="p-2">ইমেইল</th>
                <th className="p-2">রোল</th>
                <th className="p-2">যোগদান</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="p-2 font-semibold">{u.name || "—"}</td>
                  <td className="p-2">{u.phone || "—"}</td>
                  <td className="p-2">{u.email || "—"}</td>
                  <td className="p-2">
                    <span
                      className={`badge ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-slate-500">
                    {new Date(u.created_at).toLocaleDateString("bn-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "listings" && (
        <div className="space-y-3">
          {items.map((l) => (
            <div key={l.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm">
                  <Link
                    href={`/listing/${l.id}`}
                    className="font-semibold hover:underline"
                  >
                    {l.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {typeLabel(l.type)} • {l.thana} • {l.ward} • ৳
                    {l.rent.toLocaleString("en-US")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="badge bg-slate-100 text-slate-700">
                      {statusLabel(l.status)}
                    </span>
                    <span className="badge bg-blue-100 text-blue-800">
                      👁️ {l.views}
                    </span>
                    {l.is_featured && (
                      <span className="badge bg-amber-400 text-amber-950">
                        ⭐ ফিচার্ড
                        {l.featured_until &&
                          ` (${new Date(l.featured_until).toLocaleDateString(
                            "bn-BD"
                          )} পর্যন্ত)`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {l.is_featured ? (
                  <button
                    onClick={() => unfeature(l.id)}
                    disabled={busyId === l.id}
                    className="btn-secondary !px-3 !py-1.5 text-sm"
                  >
                    ⭐ আনফিচার্ড
                  </button>
                ) : (
                  <button
                    onClick={() => feature(l.id)}
                    disabled={busyId === l.id}
                    className="btn-primary !px-3 !py-1.5 text-sm"
                  >
                    ⭐ ফিচার্ড করো (৩০ দিন)
                  </button>
                )}
                <button
                  onClick={() => hide(l.id)}
                  disabled={busyId === l.id}
                  className="btn-secondary !px-3 !py-1.5 text-sm"
                >
                  🙈 হাইড
                </button>
                <button
                  onClick={() => remove(l.id)}
                  disabled={busyId === l.id}
                  className="!px-3 !py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                >
                  🗑️ ডিলিট
                </button>
              </div>
            </div>
          ))}
          {!items.length && (
            <p className="card p-6 text-center text-slate-500">
              কোনো লিস্টিং নেই
            </p>
          )}
        </div>
      )}

      {tab === "feedback" && (
        <div className="space-y-3">
          {feedback.map((f) => (
            <div key={f.id} className="card p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge bg-purple-100 text-purple-800">
                  {feedbackTypeLabel(f.type)}
                </span>
                <span className="text-xs text-slate-500">{bnDate(f.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{f.message}</p>
              <p className="mt-2 text-xs text-slate-500">
                👤 {f.profiles?.name || "নাম নেই"}
                {f.profiles?.phone ? ` • 📞 ${f.profiles.phone}` : ""}
              </p>
            </div>
          ))}
          {!feedback.length && (
            <p className="card p-6 text-center text-slate-500">
              এখনো কোনো ফিডব্যাক আসেনি
            </p>
          )}
        </div>
      )}

      {tab === "inquiries" && (
        <div className="space-y-3">
          {/* প্রতি লিস্টিংয়ে মোট */}
          {Object.keys(inquiryCounts).length > 0 && (
            <div className="card p-3">
              <h3 className="font-bold text-sm">📊 লিস্টিং অনুযায়ী মোট যোগাযোগ</h3>
              <div className="mt-2 space-y-1">
                {Object.entries(inquiryCounts)
                  .sort((a, b) => b[1].n - a[1].n)
                  .map(([lid, c]) => (
                    <div
                      key={lid}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <Link
                        href={`/listing/${lid}`}
                        className="truncate hover:underline"
                      >
                        {c.title}
                      </Link>
                      <span className="badge bg-purple-100 text-purple-800 whitespace-nowrap">
                        📞 {c.n} বার
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {/* বিস্তারিত তালিকা — নতুন আগে */}
          {inquiries.map((q) => (
            <div key={q.id} className="card p-3 text-sm">
              <Link
                href={`/listing/${q.listing_id}`}
                className="font-semibold hover:underline"
              >
                🏠 {q.listings?.title || "ডিলিট হওয়া লিস্টিং"}
              </Link>
              <p className="mt-1 text-slate-600">
                👤 {q.profiles?.name || "নাম নেই"}
                {q.profiles?.phone ? (
                  <>
                    {" • "}
                    <a
                      href={`tel:${q.profiles.phone}`}
                      className="font-semibold text-emerald-700"
                    >
                      📞 {q.profiles.phone}
                    </a>
                  </>
                ) : (
                  " • ফোন নেই"
                )}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                🕒 {bnDate(q.created_at)}
              </p>
            </div>
          ))}
          {!inquiries.length && (
            <p className="card p-6 text-center text-slate-500">
              এখনো কেউ যোগাযোগ করেনি
            </p>
          )}
        </div>
      )}

      {tab === "ratings" && (
        <div className="space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="card p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/listing/${r.listing_id}`}
                  className="font-semibold hover:underline"
                >
                  🏠 {r.listings?.title || "ডিলিট হওয়া লিস্টিং"}
                </Link>
                <span className="badge bg-amber-100 text-amber-800">
                  {"⭐".repeat(r.stars)} ({r.stars}/৫)
                </span>
                <span className="text-xs text-slate-500">
                  {bnDate(r.created_at)}
                </span>
              </div>
              {r.comment && (
                <p className="mt-2 whitespace-pre-wrap text-slate-700">
                  "{r.comment}"
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                👤 {r.profiles?.name || "নাম নেই"}
                {r.profiles?.phone ? ` • 📞 ${r.profiles.phone}` : ""}
              </p>
            </div>
          ))}
          {!ratings.length && (
            <p className="card p-6 text-center text-slate-500">
              এখনো কোনো রেটিং আসেনি
            </p>
          )}
        </div>
      )}
    </div>
  );
}
