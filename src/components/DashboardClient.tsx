"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardListing } from "@/lib/types";
import { typeLabel, statusLabel } from "@/lib/data";

export default function DashboardClient({
  listings,
}: {
  listings: DashboardListing[];
}) {
  const supabase = createClient();
  const [items, setItems] = useState(listings);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => window.location.reload();

  const markRented = async (id: string) => {
    if (!confirm("নিশ্চিত ভাড়া হয়ে গেছে? লিস্টিংটি হাইড হয়ে যাবে।")) return;
    setBusyId(id);
    await supabase.from("listings").update({ status: "rented" }).eq("id", id);
    setBusyId(null);
    refresh();
  };

  const renew = async (id: string) => {
    setBusyId(id);
    const expires = new Date(Date.now() + 30 * 86400000).toISOString();
    await supabase
      .from("listings")
      .update({ status: "active", expires_at: expires })
      .eq("id", id);
    setBusyId(null);
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("বিজ্ঞাপনটি ডিলিট করবেন?")) return;
    setBusyId(id);
    await supabase.from("listings").delete().eq("id", id);
    setItems((it) => it.filter((l) => l.id !== id));
    setBusyId(null);
  };

  if (!items.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-4xl">📭</p>
        <p className="mt-2 font-semibold">এখনো কোনো বিজ্ঞাপন দেননি</p>
        <Link href="/post" className="btn-primary mt-4">
          + প্রথম বিজ্ঞাপন দিন
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((l) => (
        <div key={l.id} className="card p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link
                href={`/listing/${l.id}`}
                className="font-semibold hover:underline"
              >
                {l.title}
              </Link>
              <p className="text-xs text-slate-500">
                {typeLabel(l.type)} • {l.thana} • {l.ward} • ৳
                {l.rent.toLocaleString("en-US")}/মাস
              </p>
              <div className="mt-1 flex flex-wrap gap-2 text-xs">
                <span
                  className={`badge ${
                    l.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : l.status === "rented"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {statusLabel(l.status)}
                </span>
                <span className="badge bg-blue-100 text-blue-800">
                  👁️ {l.views} ভিউ
                </span>
                <span className="badge bg-purple-100 text-purple-800">
                  📞 {l.inquiry_count} যোগাযোগ
                </span>
                <span className="badge bg-amber-100 text-amber-800">
                  ❓ {l.nudge_count} খালি-আছে জিজ্ঞাসা
                </span>
                {l.is_featured && (
                  <span className="badge bg-amber-400 text-amber-950">
                    ⭐ ফিচার্ড
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                মেয়াদ শেষ: {new Date(l.expires_at).toLocaleDateString("bn-BD")}
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {l.status === "active" && (
              <button
                onClick={() => markRented(l.id)}
                disabled={busyId === l.id}
                className="btn-primary !px-3 !py-1.5 text-sm"
              >
                ✅ ভাড়া হয়ে গেছে
              </button>
            )}
            {l.status !== "active" && (
              <button
                onClick={() => renew(l.id)}
                disabled={busyId === l.id}
                className="btn-secondary !px-3 !py-1.5 text-sm"
              >
                🔄 রিনিউ (৩০ দিন)
              </button>
            )}
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
    </div>
  );
}
