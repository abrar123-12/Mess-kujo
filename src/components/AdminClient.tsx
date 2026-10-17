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
  Notification,
} from "@/lib/types";
import { typeLabel, statusLabel } from "@/lib/data";

type Tab = "listings" | "users" | "feedback" | "inquiries" | "ratings" | "notices";

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
  notifications,
  currentUserId,
}: {
  users: Profile[];
  listings: Listing[];
  feedback: Feedback[];
  inquiries: Inquiry[];
  ratings: RentalFeedback[];
  notifications: Notification[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("users");
  const [items, setItems] = useState(listings);
  const [userList, setUserList] = useState(users);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // নোটিশ ফর্ম
  const [noticeList, setNoticeList] = useState(notifications);
  const [nTitle, setNTitle] = useState("");
  const [nMessage, setNMessage] = useState("");
  const [nTarget, setNTarget] = useState<"all" | "user">("all");
  const [nUserSearch, setNUserSearch] = useState("");
  const [nSelectedUserId, setNSelectedUserId] = useState<string | null>(null);
  const [nSending, setNSending] = useState(false);

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

  // ---------- সুপার ইউজার ম্যানেজমেন্ট ----------
  const isSelf = (id: string) => id === currentUserId;

  const setBan = async (u: Profile, ban: boolean) => {
    if (isSelf(u.id)) return;
    const label = u.name || u.phone || u.email || "ইউজার";
    if (
      !confirm(
        ban
          ? `⛔ "${label}" কে স্থগিত করবেন?\n(লগইন ও সব কাজ বন্ধ হয়ে যাবে)`
          : `✅ "${label}" কে আবার সক্রিয় করবেন?`
      )
    )
      return;
    setBusyId(u.id);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: ban, banned_at: ban ? now : null })
      .eq("id", u.id);
    if (!error) {
      setUserList((list) =>
        list.map((x) =>
          x.id === u.id
            ? { ...x, is_banned: ban, banned_at: ban ? now : null }
            : x
        )
      );
    } else {
      alert("❌ ব্যর্থ: " + error.message);
    }
    setBusyId(null);
  };

  const toggleRole = async (u: Profile) => {
    if (isSelf(u.id)) return;
    const toAdmin = u.role !== "admin";
    const label = u.name || u.phone || u.email || "ইউজার";
    if (
      !confirm(
        toAdmin
          ? `👑 "${label}" কে অ্যাডমিন বানাবেন?`
          : `⚠️ "${label}" এর অ্যাডমিন ক্ষমতা বাতিল করবেন?`
      )
    )
      return;
    setBusyId(u.id);
    const { error } = await supabase
      .from("profiles")
      .update({ role: toAdmin ? "admin" : "user" })
      .eq("id", u.id);
    if (!error) {
      setUserList((list) =>
        list.map((x) =>
          x.id === u.id ? { ...x, role: toAdmin ? "admin" : "user" } : x
        )
      );
    } else {
      alert("❌ ব্যর্থ: " + error.message);
    }
    setBusyId(null);
  };

  // ---------- নোটিশ পাঠানো ----------
  const sendNotice = async () => {
    const title = nTitle.trim();
    const message = nMessage.trim();
    if (!title || !message) {
      alert("⚠️ শিরোনাম ও মেসেজ দুটোই লিখুন");
      return;
    }
    const targetId = nTarget === "user" ? nSelectedUserId : null;
    if (nTarget === "user" && !targetId) {
      alert("⚠️ একজন ইউজার সিলেক্ট করুন");
      return;
    }
    setNSending(true);
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        target_user_id: targetId,
        created_by: currentUserId,
      })
      .select()
      .single();
    if (error) {
      alert("❌ ব্যর্থ: " + error.message);
    } else {
      setNoticeList((list) => [data as Notification, ...list]);
      setNTitle("");
      setNMessage("");
      setNTarget("all");
      setNSelectedUserId(null);
      setNUserSearch("");
      alert("✅ নোটিশ পাঠানো হয়েছে!");
    }
    setNSending(false);
  };

  const deleteNotice = async (id: string) => {
    if (!confirm("🗑️ এই নোটিশটি ডিলিট করবেন?")) return;
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) {
      alert("❌ ব্যর্থ: " + error.message);
    } else {
      setNoticeList((list) => list.filter((n) => n.id !== id));
    }
  };

  const noticeTargetLabel = (n: Notification): string => {
    if (!n.target_user_id) return "📢 সবাই";
    const u = userList.find((x) => x.id === n.target_user_id);
    return `👤 ${u?.name || u?.phone || u?.email || "ইউজার"}`;
  };

  // নোটিশ টার্গেটের জন্য ইউজার সার্চ
  const nq = nUserSearch.trim().toLowerCase();
  const nFilteredUsers = userList
    .filter(
      (u) =>
        !nq ||
        (u.name || "").toLowerCase().includes(nq) ||
        (u.phone || "").toLowerCase().includes(nq) ||
        (u.email || "").toLowerCase().includes(nq)
    )
    .slice(0, 8);
  const nSelectedUser = nSelectedUserId
    ? userList.find((u) => u.id === nSelectedUserId) ?? null
    : null;

  // ইউজার পরিসংখ্যান
  const weekAgo = Date.now() - 7 * 86400000;
  const statTotal = userList.length;
  const statNew = userList.filter(
    (u) => new Date(u.created_at).getTime() >= weekAgo
  ).length;
  const statBanned = userList.filter((u) => u.is_banned).length;
  const statAdmins = userList.filter((u) => u.role === "admin").length;

  // সার্চ ফিল্টার
  const uq = userSearch.trim().toLowerCase();
  const filteredUsers = userList.filter(
    (u) =>
      !uq ||
      (u.name || "").toLowerCase().includes(uq) ||
      (u.phone || "").toLowerCase().includes(uq) ||
      (u.email || "").toLowerCase().includes(uq)
  );

  const listingCountOf = (uid: string) =>
    listings.filter((l) => l.owner_id === uid).length;

  // ডিটেইল মোডালের জন্য নির্বাচিত ইউজারের তথ্য
  const selected =
    selectedUserId != null
      ? userList.find((u) => u.id === selectedUserId) ?? null
      : null;
  const selListings = selected
    ? listings.filter((l) => l.owner_id === selected.id)
    : [];
  const selInquiries = selected
    ? inquiries.filter((x) => x.from_user_id === selected.id)
    : [];
  const selFeedback = selected
    ? feedback.filter((f) => f.user_id === selected.id)
    : [];
  const selRatings = selected
    ? ratings.filter((r) => r.rater_id === selected.id)
    : [];

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
        {tabBtn("users", `👥 ইউজার (${userList.length})`)}
        {tabBtn("feedback", `💬 ফিডব্যাক (${feedback.length})`)}
        {tabBtn("inquiries", `📞 যোগাযোগ (${inquiries.length})`)}
        {tabBtn("ratings", `⭐ রেটিং (${ratings.length})`)}
        {tabBtn("notices", `🔔 নোটিশ (${noticeList.length})`)}
      </div>

      {tab === "users" && (
        <div className="space-y-3">
          {/* পরিসংখ্যান কার্ড */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="card p-3 text-center">
              <p className="text-2xl font-extrabold text-slate-800">
                {statTotal}
              </p>
              <p className="text-xs text-slate-500">👥 মোট ইউজার</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-extrabold text-emerald-700">
                {statNew}
              </p>
              <p className="text-xs text-slate-500">🆕 নতুন (৭ দিনে)</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-extrabold text-red-600">
                {statBanned}
              </p>
              <p className="text-xs text-slate-500">⛔ স্থগিত</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-2xl font-extrabold text-purple-700">
                {statAdmins}
              </p>
              <p className="text-xs text-slate-500">👑 অ্যাডমিন</p>
            </div>
          </div>

          {/* সার্চ */}
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="🔍 নাম / ফোন / ইমেইল দিয়ে খুঁজুন..."
            className="w-full"
          />

          {/* ইউজার টেবিল */}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="p-2">নাম</th>
                  <th className="p-2">ফোন</th>
                  <th className="p-2">ইমেইল</th>
                  <th className="p-2">রোল</th>
                  <th className="p-2">বিজ্ঞাপন</th>
                  <th className="p-2">যোগদান</th>
                  <th className="p-2">স্ট্যাটাস</th>
                  <th className="p-2">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="cursor-pointer border-t hover:bg-slate-50"
                  >
                    <td className="p-2 font-semibold">
                      {u.name || "—"}
                      {isSelf(u.id) && (
                        <span className="badge ml-1 bg-blue-100 text-blue-800">
                          আপনি
                        </span>
                      )}
                    </td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      {u.phone ? (
                        <a
                          href={`tel:${u.phone}`}
                          className="font-semibold text-emerald-700"
                        >
                          📞 {u.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2">{u.email || "—"}</td>
                    <td className="p-2">
                      <span
                        className={`badge ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {u.role === "admin" ? "👑 অ্যাডমিন" : "👤 ইউজার"}
                      </span>
                    </td>
                    <td className="p-2 text-center font-semibold">
                      {listingCountOf(u.id)}
                    </td>
                    <td className="p-2 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="p-2">
                      {u.is_banned ? (
                        <span className="badge bg-red-100 text-red-700">
                          ⛔ স্থগিত
                        </span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-700">
                          ✅ সক্রিয়
                        </span>
                      )}
                    </td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setBan(u, !u.is_banned)}
                          disabled={isSelf(u.id) || busyId === u.id}
                          title={
                            isSelf(u.id)
                              ? "নিজেকে পরিবর্তন করা যাবে না"
                              : u.is_banned
                              ? "সক্রিয় করুন"
                              : "স্থগিত করুন"
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"
                        >
                          {u.is_banned ? "✅" : "⛔"}
                        </button>
                        <button
                          onClick={() => toggleRole(u)}
                          disabled={isSelf(u.id) || busyId === u.id}
                          title={
                            isSelf(u.id)
                              ? "নিজেকে পরিবর্তন করা যাবে না"
                              : u.role === "admin"
                              ? "অ্যাডমিন বাতিল"
                              : "অ্যাডমিন করুন"
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"
                        >
                          👑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!filteredUsers.length && (
              <p className="p-6 text-center text-sm text-slate-500">
                {userSearch ? "🔍 কিছু পাওয়া যায়নি" : "কোনো ইউজার নেই"}
              </p>
            )}
          </div>
          <p className="text-xs text-slate-500">
            💡 কোনো রো-তে ট্যাপ করলে ইউজারের বিস্তারিত (বিজ্ঞাপন, যোগাযোগ,
            ফিডব্যাক, রেটিং) দেখা যাবে।
          </p>
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
      {tab === "notices" && (
        <div className="space-y-3">
          {/* নোটিশ পাঠানোর ফর্ম */}
          <div className="card space-y-3 p-4">
            <h3 className="font-bold">📣 নতুন নোটিশ পাঠান</h3>
            <input
              type="text"
              value={nTitle}
              onChange={(e) => setNTitle(e.target.value)}
              placeholder="শিরোনাম (যেমন: ঈদ অফার! 🎉)"
              maxLength={120}
              className="w-full"
            />
            <textarea
              value={nMessage}
              onChange={(e) => setNMessage(e.target.value)}
              placeholder="মেসেজ লিখুন... (ইউজারদের 🔔 বেলে দেখাবে)"
              rows={3}
              className="w-full"
            />
            {/* টার্গেট সিলেক্ট */}
            <div className="flex flex-wrap gap-2">
              <label
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                  nTarget === "all"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  checked={nTarget === "all"}
                  onChange={() => setNTarget("all")}
                  className="mr-1.5"
                />
                📢 সবাইকে
              </label>
              <label
                className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold ${
                  nTarget === "user"
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  checked={nTarget === "user"}
                  onChange={() => setNTarget("user")}
                  className="mr-1.5"
                />
                👤 নির্দিষ্ট ইউজার
              </label>
            </div>
            {nTarget === "user" && (
              <div className="space-y-2">
                {nSelectedUser ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                    <span className="font-semibold">
                      ✓ {nSelectedUser.name || "নাম নেই"}
                      {nSelectedUser.phone
                        ? ` • 📞 ${nSelectedUser.phone}`
                        : ""}
                    </span>
                    <button
                      onClick={() => setNSelectedUserId(null)}
                      className="text-slate-500 hover:text-red-600"
                    >
                      ✕ বদলান
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="search"
                      value={nUserSearch}
                      onChange={(e) => setNUserSearch(e.target.value)}
                      placeholder="🔍 নাম / ফোন / ইমেইল দিয়ে খুঁজুন..."
                      className="w-full"
                    />
                    <div className="max-h-44 space-y-1 overflow-y-auto">
                      {nFilteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setNSelectedUserId(u.id)}
                          className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-emerald-50"
                        >
                          <span className="font-semibold">
                            {u.name || "নাম নেই"}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">
                            {u.phone || u.email || ""}
                          </span>
                        </button>
                      ))}
                      {!nFilteredUsers.length && (
                        <p className="p-3 text-center text-xs text-slate-400">
                          🔍 কিছু পাওয়া যায়নি
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={sendNotice}
              disabled={nSending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {nSending ? "⏳ পাঠানো হচ্ছে..." : "📨 নোটিশ পাঠান"}
            </button>
          </div>

          {/* পাঠানো নোটিশের তালিকা */}
          <h3 className="font-bold">📜 পাঠানো নোটিশ</h3>
          {noticeList.map((n) => (
            <div key={n.id} className="card p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{n.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600">
                    {n.message}
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="badge bg-blue-100 text-blue-800">
                      {noticeTargetLabel(n)}
                    </span>
                    <span>🕒 {bnDate(n.created_at)}</span>
                  </p>
                </div>
                <button
                  onClick={() => deleteNotice(n.id)}
                  title="ডিলিট"
                  className="shrink-0 rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {!noticeList.length && (
            <p className="card p-6 text-center text-slate-500">
              এখনো কোনো নোটিশ পাঠানো হয়নি
            </p>
          )}
        </div>
      )}

      {/* ইউজার ডিটেইল মোডাল */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => setSelectedUserId(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold">
                  {selected.name || "নাম নেই"}
                  {isSelf(selected.id) && (
                    <span className="badge ml-2 bg-blue-100 text-blue-800">
                      আপনি
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  {selected.email || "ইমেইল নেই"}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserId(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-slate-50 p-2">
                📞{" "}
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone}`}
                    className="font-semibold text-emerald-700"
                  >
                    {selected.phone}
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                🎭 {selected.role === "admin" ? "👑 অ্যাডমিন" : "👤 ইউজার"}
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                📅{" "}
                {new Date(selected.created_at).toLocaleDateString("bn-BD")}
              </div>
              <div className="rounded-lg bg-slate-50 p-2">
                🚦 {selected.is_banned ? "⛔ স্থগিত" : "✅ সক্রিয়"}
              </div>
            </div>

            {!isSelf(selected.id) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setBan(selected, !selected.is_banned)}
                  disabled={busyId === selected.id}
                  className={
                    selected.is_banned
                      ? "btn-secondary !px-3 !py-1.5 text-sm"
                      : "!px-3 !py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                  }
                >
                  {selected.is_banned
                    ? "✅ সক্রিয় করুন"
                    : "⛔ স্থগিত করুন"}
                </button>
                <button
                  onClick={() => toggleRole(selected)}
                  disabled={busyId === selected.id}
                  className="btn-secondary !px-3 !py-1.5 text-sm"
                >
                  {selected.role === "admin"
                    ? "⚠️ অ্যাডমিন বাতিল"
                    : "👑 অ্যাডমিন করুন"}
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                ℹ️ এটি আপনার নিজের অ্যাকাউন্ট — নিজেকে পরিবর্তন করা যাবে না।
              </p>
            )}

            {/* বিজ্ঞাপন */}
            <div className="mt-4">
              <h4 className="text-sm font-bold">
                🏠 বিজ্ঞাপন ({selListings.length})
              </h4>
              {selListings.map((l) => (
                <div
                  key={l.id}
                  className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <Link
                    href={`/listing/${l.id}`}
                    className="truncate font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                  <span className="badge whitespace-nowrap bg-slate-200 text-slate-700">
                    {statusLabel(l.status)}
                  </span>
                </div>
              ))}
              {!selListings.length && (
                <p className="mt-1 text-xs text-slate-400">
                  কোনো বিজ্ঞাপন নেই
                </p>
              )}
            </div>

            {/* যোগাযোগ করেছে */}
            <div className="mt-3">
              <h4 className="text-sm font-bold">
                📞 যোগাযোগ করেছে ({selInquiries.length})
              </h4>
              {selInquiries.map((q) => (
                <div
                  key={q.id}
                  className="mt-1 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <Link
                    href={`/listing/${q.listing_id}`}
                    className="font-medium hover:underline"
                  >
                    🏠 {q.listings?.title || "ডিলিট হওয়া লিস্টিং"}
                  </Link>
                  <p className="text-xs text-slate-500">
                    🕒 {bnDate(q.created_at)}
                  </p>
                </div>
              ))}
              {!selInquiries.length && (
                <p className="mt-1 text-xs text-slate-400">
                  কোনো যোগাযোগ নেই
                </p>
              )}
            </div>

            {/* ফিডব্যাক */}
            <div className="mt-3">
              <h4 className="text-sm font-bold">
                💬 ফিডব্যাক ({selFeedback.length})
              </h4>
              {selFeedback.map((f) => (
                <div
                  key={f.id}
                  className="mt-1 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <span className="badge bg-purple-100 text-purple-800">
                    {feedbackTypeLabel(f.type)}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap">{f.message}</p>
                  <p className="text-xs text-slate-500">
                    🕒 {bnDate(f.created_at)}
                  </p>
                </div>
              ))}
              {!selFeedback.length && (
                <p className="mt-1 text-xs text-slate-400">
                  কোনো ফিডব্যাক নেই
                </p>
              )}
            </div>

            {/* রেটিং */}
            <div className="mt-3">
              <h4 className="text-sm font-bold">
                ⭐ রেটিং দিয়েছে ({selRatings.length})
              </h4>
              {selRatings.map((r) => (
                <div
                  key={r.id}
                  className="mt-1 rounded-lg bg-slate-50 p-2 text-sm"
                >
                  <span className="badge bg-amber-100 text-amber-800">
                    {"⭐".repeat(r.stars)} ({r.stars}/৫)
                  </span>
                  <Link
                    href={`/listing/${r.listing_id}`}
                    className="ml-2 font-medium hover:underline"
                  >
                    🏠 {r.listings?.title || "ডিলিট হওয়া লিস্টিং"}
                  </Link>
                  {r.comment && (
                    <p className="mt-1 whitespace-pre-wrap">
                      &ldquo;{r.comment}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    🕒 {bnDate(r.created_at)}
                  </p>
                </div>
              ))}
              {!selRatings.length && (
                <p className="mt-1 text-xs text-slate-400">
                  কোনো রেটিং নেই
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
