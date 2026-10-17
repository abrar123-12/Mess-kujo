"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import FilterBar from "@/components/FilterBar";

export default function HomePage() {
  const supabase = createClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [thana, setThana] = useState("");
  const [ward, setWard] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(200);
      setListings((data as Listing[]) || []);
      setLoading(false);
    };
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = listings.filter((l) => {
    if (thana && l.thana !== thana) return false;
    if (ward && l.ward !== ward) return false;
    if (type && l.type !== type) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${l.title} ${l.thana} ${l.ward} ${l.address || ""} ${
        l.description || ""
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="py-4">
      {/* হিরো */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-emerald-500 p-5 text-white md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">
          চট্টগ্রামে মেস, সাবলেট, রুম খুঁজুন 🏠
        </h1>
        <p className="mt-1 text-emerald-50">
          থানা ও ওয়ার্ড অনুযায়ী — সরাসরি মালিকের সাথে যোগাযোগ
        </p>
        <Link
          href="/post"
          className="mt-4 inline-block rounded-lg bg-amber-400 px-5 py-2.5 font-bold text-emerald-950 hover:bg-amber-300"
        >
          + ফ্রিতে বিজ্ঞাপন দিন
        </Link>
      </div>

      {/* ফিল্টার */}
      <div className="mt-4">
        <FilterBar
          thana={thana}
          ward={ward}
          type={type}
          query={query}
          onThana={setThana}
          onWard={setWard}
          onType={setType}
          onQuery={setQuery}
          onReset={() => {
            setThana("");
            setWard("");
            setType("");
            setQuery("");
          }}
        />
      </div>

      {/* লিস্টিং */}
      <p className="mt-4 text-sm text-slate-600">
        {loading ? "লোড হচ্ছে..." : `${filtered.length}টি বিজ্ঞাপন পাওয়া গেছে`}
      </p>
      {loading ? (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[4/3] bg-slate-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 rounded bg-slate-200" />
                <div className="h-4 w-2/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card mt-3 p-8 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-semibold">কোনো বিজ্ঞাপন পাওয়া যায়নি</p>
          <p className="text-sm text-slate-500">
            ফিল্টার বদলে দেখুন অথবা নতুন বিজ্ঞাপন দিন
          </p>
          <Link href="/post" className="btn-primary mt-4">
            + বিজ্ঞাপন দিন
          </Link>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
