"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/types";
import { typeLabel } from "@/lib/data";
import { BANNED_MESSAGE } from "@/lib/requireActiveUser";

export default function ListingDetail({
  listing,
  isOwner,
}: {
  listing: Listing;
  isOwner: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [phoneShown, setPhoneShown] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const photos = [...(listing.listing_photos || [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const [activePhoto, setActivePhoto] = useState(0);

  const needLogin = async (): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/listing/${listing.id}`);
      return null;
    }
    return user.id;
  };

  // যোগাযোগ → inquiry রো হিসেবে সেভ + নম্বর দেখাও
  const contact = async () => {
    setMsg("");
    const uid = await needLogin();
    if (!uid) return;
    setBusy(true);
    // স্থগিত অ্যাকাউন্ট যোগাযোগ করতে পারবে না
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", uid)
      .maybeSingle();
    if (profile && (profile as { is_banned: boolean }).is_banned) {
      await supabase.auth.signOut();
      setMsg(BANNED_MESSAGE);
      setBusy(false);
      return;
    }
    const { error } = await supabase.from("inquiries").insert({
      listing_id: listing.id,
      from_user_id: uid,
      message: "ফোনে যোগাযোগ করতে চান",
    });
    setBusy(false);
    if (error) {
      setMsg("❌ সমস্যা হয়েছে, আবার চেষ্টা করুন");
      return;
    }
    setPhoneShown(true);
    setMsg("✅ আপনার আগ্রহ মালিকের কাছে পৌঁছেছে");
  };

  // এখনো খালি আছে? → মালিকের কাছে nudge
  const nudge = async () => {
    setMsg("");
    const uid = await needLogin();
    if (!uid) return;
    setBusy(true);
    const { error } = await supabase.from("nudges").insert({
      listing_id: listing.id,
      from_user_id: uid,
    });
    setBusy(false);
    if (error) {
      if (error.code === "23505") {
        setMsg("ℹ️ আপনি আগেই জিজ্ঞেস করেছেন — মালিক শীঘ্রই জানাবেন");
      } else {
        setMsg("❌ সমস্যা হয়েছে, আবার চেষ্টা করুন");
      }
      return;
    }
    setMsg("✅ মালিককে জিজ্ঞেস করা হয়েছে — উত্তর পেলে জানতে পারবেন");
  };

  return (
    <div className="py-4">
      <Link href="/" className="text-sm text-emerald-700 font-semibold">
        ← সব বিজ্ঞাপন
      </Link>

      <div className="card mt-2">
        {/* গ্যালারি */}
        <div className="relative aspect-[4/3] bg-slate-100">
          {photos.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[activePhoto].url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl">
              🏠
            </div>
          )}
          {listing.is_featured && (
            <span className="badge absolute left-2 top-2 bg-amber-400 text-amber-950">
              ⭐ ফিচার্ড
            </span>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-2">
            {photos.map((p, i) => (
              <button key={p.id} onClick={() => setActivePhoto(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`ছবি ${i + 1}`}
                  className={`h-16 w-16 rounded-lg object-cover ${
                    i === activePhoto ? "ring-2 ring-emerald-600" : "opacity-70"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="badge bg-emerald-100 text-emerald-800">
              {typeLabel(listing.type)}
            </span>
            <span className="text-sm text-slate-500">
              👁️ {listing.views} বার দেখা হয়েছে
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold">{listing.title}</h1>
          <p className="mt-1 text-slate-600">
            📍 {listing.thana} • {listing.ward}
            {listing.address ? ` — ${listing.address}` : ""}
          </p>
          {listing.lat != null && listing.lng != null && (
            <a
              href={`https://www.google.com/maps?q=${listing.lat},${listing.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-3 w-full"
            >
              🗺️ গুগল ম্যাপে দেখুন
            </a>
          )}
          <p className="mt-3 text-3xl font-bold text-emerald-700">
            ৳{listing.rent.toLocaleString("en-US")}
            <span className="text-sm font-normal text-slate-500">/মাস</span>
          </p>

          <div className="mt-4 rounded-lg bg-slate-50 p-3">
            <h2 className="font-bold">বর্ণনা</h2>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">
              {listing.description || "বর্ণনা দেওয়া হয়নি"}
            </p>
          </div>

          {msg && (
            <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">
              {msg}
            </p>
          )}

          {/* অ্যাকশন */}
          {isOwner ? (
            <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm">
              ℹ️ এটা আপনার বিজ্ঞাপন —{" "}
              <Link href="/dashboard" className="font-bold text-emerald-700 underline">
                ড্যাশবোর্ডে ম্যানেজ করুন
              </Link>
            </div>
          ) : phoneShown ? (
            <a href={`tel:${listing.phone}`} className="btn-primary mt-4 w-full text-lg">
              📞 {listing.phone} — কল করুন
            </a>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-2">
              <button onClick={contact} disabled={busy} className="btn-primary w-full">
                📞 যোগাযোগ করুন
              </button>
              <button onClick={nudge} disabled={busy} className="btn-secondary w-full">
                ❓ এখনো খালি আছে?
              </button>
              <p className="text-center text-xs text-slate-500">
                যোগাযোগ করলে আপনার আগ্রহ রেকর্ড হবে, মালিকও দেখতে পাবেন
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
