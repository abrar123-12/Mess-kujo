"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Listing } from "@/lib/types";
import { typeLabel } from "@/lib/data";

const FAV_KEY = "mk-favorites";

export function getFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
  } catch {
    return [];
  }
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const [fav, setFav] = useState(false);

  useEffect(() => {
    setFav(getFavorites().includes(listing.id));
  }, [listing.id]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    const favs = getFavorites();
    const next = favs.includes(listing.id)
      ? favs.filter((id) => id !== listing.id)
      : [...favs, listing.id];
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
    setFav(!fav);
  };

  const photo = [...(listing.listing_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )[0];

  return (
    <Link href={`/listing/${listing.id}`} className="card hover:shadow-md transition block">
      <div className="relative aspect-[4/3] bg-slate-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt={listing.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🏠
          </div>
        )}
        <button
          onClick={toggleFav}
          aria-label="ফেভারিট"
          className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-lg shadow"
        >
          {fav ? "❤️" : "🤍"}
        </button>
        {listing.is_featured && (
          <span className="badge absolute left-2 top-2 bg-amber-400 text-amber-950">
            ⭐ ফিচার্ড
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="mb-1 flex items-center gap-2">
          <span className="badge bg-emerald-100 text-emerald-800">
            {typeLabel(listing.type)}
          </span>
          <span className="text-xs text-slate-500">
            📍 {listing.thana} • {listing.ward}
          </span>
        </div>
        <h3 className="font-semibold leading-snug line-clamp-2 min-h-[2.6em]">
          {listing.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-700">
            ৳{listing.rent.toLocaleString("en-US")}
            <span className="text-xs font-normal text-slate-500">/মাস</span>
          </span>
          <span className="btn-secondary !px-3 !py-1.5 text-sm">যোগাযোগ</span>
        </div>
      </div>
    </Link>
  );
}
