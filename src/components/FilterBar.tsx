"use client";

import { useState } from "react";
import { THANAS, WARDS, LISTING_TYPES } from "@/lib/data";

export type SortKey = "new" | "old";

interface Props {
  thana: string;
  ward: string;
  type: string;
  query: string;
  sort: SortKey;
  onThana: (v: string) => void;
  onWard: (v: string) => void;
  onType: (v: string) => void;
  onQuery: (v: string) => void;
  onSort: (v: SortKey) => void;
  onReset: () => void;
}

export default function FilterBar(p: Props) {
  const [open, setOpen] = useState(false);
  const activeCount =
    [p.thana, p.ward, p.type].filter(Boolean).length +
    (p.sort !== "new" ? 1 : 0);

  const chip = (active: boolean, onClick: () => void, label: string) => (
    <button
      key={label}
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active
          ? "bg-emerald-600 text-white"
          : "border border-slate-300 bg-white text-slate-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* সার্চ + ফিল্টার বাটন (সবসময় দেখা যাবে) */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="🔍 খুঁজুন (যেমন: মেস, সিট...)"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          className="flex-1"
        />
        <button
          onClick={() => setOpen(true)}
          className="btn-secondary relative shrink-0"
        >
          🎛️ ফিল্টার
          {activeCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* বটম শিট */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center md:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">🔍 ফিল্টার</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="বন্ধ করুন"
                className="rounded-lg px-2 py-1 text-2xl text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* ধরন */}
            <p className="label">ধরন</p>
            <div className="flex flex-wrap gap-2">
              {chip(p.type === "", () => p.onType(""), "সব")}
              {LISTING_TYPES.map((t) =>
                chip(p.type === t.value, () => p.onType(t.value), t.label)
              )}
            </div>

            {/* থানা */}
            <p className="label mt-4">থানা</p>
            <select
              value={p.thana}
              onChange={(e) => p.onThana(e.target.value)}
            >
              <option value="">থানা: সব</option>
              {THANAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* ওয়ার্ড */}
            <p className="label mt-4">ওয়ার্ড</p>
            <select value={p.ward} onChange={(e) => p.onWard(e.target.value)}>
              <option value="">ওয়ার্ড: সব</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            {/* সাজান */}
            <p className="label mt-4">সাজান</p>
            <div className="flex gap-2">
              {chip(p.sort === "new", () => p.onSort("new"), "🆕 নতুন আগে")}
              {chip(p.sort === "old", () => p.onSort("old"), "🕰️ পুরনো আগে")}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  p.onReset();
                }}
                className="btn-secondary flex-1"
              >
                ✖️ রিসেট
              </button>
              <button
                onClick={() => setOpen(false)}
                className="btn-primary flex-1"
              >
                ✅ প্রয়োগ
                {activeCount > 0 ? ` (${activeCount})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
