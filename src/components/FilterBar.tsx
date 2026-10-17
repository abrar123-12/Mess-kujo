"use client";

import { THANAS, WARDS, LISTING_TYPES } from "@/lib/data";

interface Props {
  thana: string;
  ward: string;
  type: string;
  query: string;
  onThana: (v: string) => void;
  onWard: (v: string) => void;
  onType: (v: string) => void;
  onQuery: (v: string) => void;
  onReset: () => void;
}

export default function FilterBar(p: Props) {
  return (
    <div className="card p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <input
          type="text"
          placeholder="🔍 খুঁজুন (যেমন: মেস, সিট...)"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          className="col-span-2 md:col-span-1"
        />
        <select value={p.thana} onChange={(e) => p.onThana(e.target.value)}>
          <option value="">থানা: সব</option>
          {THANAS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={p.ward} onChange={(e) => p.onWard(e.target.value)}>
          <option value="">ওয়ার্ড: সব</option>
          {WARDS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
        <select value={p.type} onChange={(e) => p.onType(e.target.value)}>
          <option value="">ধরন: সব</option>
          {LISTING_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button onClick={p.onReset} className="btn-secondary">
          ✖️ রিসেট
        </button>
      </div>
    </div>
  );
}
