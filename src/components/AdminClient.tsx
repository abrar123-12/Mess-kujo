"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing, Profile } from "@/lib/types";
import { typeLabel, statusLabel } from "@/lib/data";

export default function AdminClient({
  users,
  listings,
}: {
  users: Profile[];
  listings: Listing[];
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<"users" | "listings">("listings");
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

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTab("listings")}
          className={`rounded-lg px-4 py-2 font-semibold ${
            tab === "listings"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-slate-300"
          }`}
        >
          🏠 লিস্টিং ({items.length})
        </button>
        <button
          onClick={() => setTab("users")}
          className={`rounded-lg px-4 py-2 font-semibold ${
            tab === "users"
              ? "bg-emerald-600 text-white"
              : "bg-white border border-slate-300"
          }`}
        >
          👥 ইউজার ({users.length})
        </button>
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
    </div>
  );
}
