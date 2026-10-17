"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Listing, NearbyListing } from "@/lib/types";
import ListingCard from "@/components/ListingCard";
import FilterBar from "@/components/FilterBar";

const RADII = [2, 5, 10];

export default function HomePage() {
  const supabase = createClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [thana, setThana] = useState("");
  const [ward, setWard] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  // কাছাকাছি খোঁজা
  const [nearMe, setNearMe] = useState(false);
  const [radius, setRadius] = useState(5);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [nearResults, setNearResults] = useState<NearbyListing[] | null>(null);
  const [nearLoading, setNearLoading] = useState(false);
  const [nearError, setNearError] = useState("");

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

  const fetchNearby = async (lat: number, lng: number, r: number) => {
    setNearLoading(true);
    setNearError("");
    const { data, error } = await supabase.rpc("nearby_listings", {
      user_lat: lat,
      user_lng: lng,
      radius_km: r,
    });
    setNearLoading(false);
    if (error) {
      setNearError("❌ খোঁজার সময় সমস্যা হয়েছে, আবার চেষ্টা করুন");
      return;
    }
    setNearResults((data as NearbyListing[]) || []);
  };

  const toggleNearMe = () => {
    if (nearMe) {
      setNearMe(false);
      setNearResults(null);
      setNearError("");
      return;
    }
    setNearError("");
    if (!navigator.geolocation) {
      setNearError("আপনার ব্রাউজার লোকেশন সাপোর্ট করে না");
      return;
    }
    setNearLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLoc(loc);
        setNearMe(true);
        fetchNearby(loc.lat, loc.lng, radius);
      },
      () => {
        setNearLoading(false);
        setNearError(
          "😕 লোকেশন পাওয়া যায়নি — ব্রাউজার সেটিংসে লোকেশন পারমিশন দিন, তারপর আবার চেষ্টা করুন"
        );
      },
      { timeout: 12000 }
    );
  };

  const changeRadius = (r: number) => {
    setRadius(r);
    if (nearMe && userLoc) fetchNearby(userLoc.lat, userLoc.lng, r);
  };

  const baseList: Listing[] = nearMe && nearResults ? nearResults : listings;

  const filtered = baseList.filter((l) => {
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

  const distanceOf = (l: Listing): number | undefined =>
    "distance_km" in l ? (l as NearbyListing).distance_km : undefined;

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

      {/* কাছাকাছি */}
      <div className="card mt-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleNearMe}
            disabled={nearLoading}
            className={nearMe ? "btn-primary" : "btn-secondary"}
          >
            {nearMe ? "📍 কাছাকাছি: চালু ✖️" : "📍 আমার কাছাকাছি"}
          </button>
          {nearMe && (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-600">ব্যাসার্ধ:</span>
              {RADII.map((r) => (
                <button
                  key={r}
                  onClick={() => changeRadius(r)}
                  className={`rounded-lg px-3 py-1.5 font-semibold ${
                    radius === r
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  {r} কিমি
                </button>
              ))}
            </div>
          )}
        </div>
        {nearLoading && !nearMe && (
          <p className="mt-2 text-sm text-slate-600">
            📡 আপনার লোকেশন নেওয়া হচ্ছে...
          </p>
        )}
        {nearError && (
          <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-700">
            {nearError}
          </p>
        )}
        {nearMe && nearResults && (
          <p className="mt-2 text-sm text-emerald-700">
            ✅ {radius} কিমির মধ্যে {nearResults.length}টি বিজ্ঞাপন — দূরত্ব
            অনুযায়ী সাজানো
          </p>
        )}
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
        {loading || (nearMe && nearLoading)
          ? "লোড হচ্ছে..."
          : `${filtered.length}টি বিজ্ঞাপন পাওয়া গেছে`}
      </p>
      {loading || (nearMe && nearLoading) ? (
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
            {nearMe
              ? "এই এলাকায় কোনো লোকেশন-সহ বিজ্ঞাপন নেই — ব্যাসার্ধ বাড়িয়ে দেখুন"
              : "ফিল্টার বদলে দেখুন অথবা নতুন বিজ্ঞাপন দিন"}
          </p>
          <Link href="/post" className="btn-primary mt-4">
            + বিজ্ঞাপন দিন
          </Link>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((l) => (
            <ListingCard key={l.id} listing={l} distanceKm={distanceOf(l)} />
          ))}
        </div>
      )}
    </div>
  );
}
