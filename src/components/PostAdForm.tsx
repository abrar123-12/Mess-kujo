"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { THANAS, WARDS, LISTING_TYPES, typeLabel } from "@/lib/data";

const STEPS = ["শিরোনাম", "এলাকা", "ভাড়া ও যোগাযোগ", "ছবি", "রিভিউ"];

export default function PostAdForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("mess_seat");
  const [thana, setThana] = useState("");
  const [ward, setWard] = useState("");
  const [address, setAddress] = useState("");
  const [rent, setRent] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []).slice(0, 6 - files.length);
    if (!picked.length) return;
    setFiles((f) => [...f, ...picked]);
    setPreviews((p) => [...p, ...picked.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (i: number) => {
    setFiles((f) => f.filter((_, idx) => idx !== i));
    setPreviews((p) => {
      URL.revokeObjectURL(p[i]);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const validStep = () => {
    if (step === 0) return title.trim().length >= 5 && !!type;
    if (step === 1) return !!thana && !!ward;
    if (step === 2)
      return (
        Number(rent) > 0 &&
        phone.replace(/\D/g, "").length >= 11 &&
        description.trim().length >= 10
      );
    return true;
  };

  const hint = () => {
    if (step === 0 && title.trim().length < 5)
      return "শিরোনাম কমপক্ষে ৫ অক্ষরের দিন";
    if (step === 1) return "থানা ও ওয়ার্ড দুটোই সিলেক্ট করুন";
    if (step === 2) {
      if (!(Number(rent) > 0)) return "সঠিক মাসিক ভাড়া দিন";
      if (phone.replace(/\D/g, "").length < 11)
        return "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন";
      if (description.trim().length < 10)
        return "বর্ণনা কমপক্ষে ১০ অক্ষরের দিন";
    }
    return "";
  };

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      const { data: listing, error: insErr } = await supabase
        .from("listings")
        .insert({
          owner_id: userId,
          title: title.trim(),
          type,
          thana,
          ward,
          address: address.trim() || null,
          rent: Number(rent),
          phone: phone.trim(),
          description: description.trim(),
          status: "active",
        })
        .select("id")
        .single();
      if (insErr || !listing) throw insErr || new Error("insert failed");

      // ছবি আপলোড → Supabase Storage
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const path = `${userId}/${listing.id}/${Date.now()}-${i}-${f.name}`;
        const { error: upErr } = await supabase.storage
          .from("listing-photos")
          .upload(path, f);
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from("listing-photos")
          .getPublicUrl(path);
        const { error: phErr } = await supabase.from("listing_photos").insert({
          listing_id: listing.id,
          url: data.publicUrl,
          sort_order: i,
        });
        if (phErr) throw phErr;
      }

      router.push(`/listing/${listing.id}`);
      router.refresh();
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন"
      );
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      {/* প্রগ্রেস */}
      <div className="mb-5 flex gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                i < step
                  ? "bg-emerald-600 text-white"
                  : i === step
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-200"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <div className="mt-1 text-[11px] text-slate-600">{s}</div>
          </div>
        ))}
      </div>

      {/* ধাপ ১: শিরোনাম + ধরন */}
      {step === 0 && (
        <div className="space-y-3">
          <div>
            <label className="label">বিজ্ঞাপনের শিরোনাম *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: পাঁচলাইশে ছাত্র মেসে ১টি সিট খালি"
              maxLength={80}
            />
          </div>
          <div>
            <label className="label">ধরন *</label>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-lg border-2 px-3 py-3 font-semibold ${
                    type === t.value
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ধাপ ২: এলাকা */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="label">থানা * (চট্টগ্রাম সিটি)</label>
            <select value={thana} onChange={(e) => setThana(e.target.value)}>
              <option value="">-- থানা সিলেক্ট করুন --</option>
              {THANAS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">ওয়ার্ড *</label>
            <select value={ward} onChange={(e) => setWard(e.target.value)}>
              <option value="">-- ওয়ার্ড সিলেক্ট করুন --</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">বিস্তারিত ঠিকানা (ঐচ্ছিক)</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="বাসা/হোল্ডিং, রোড, ল্যান্ডমার্ক..."
              rows={2}
            />
          </div>
        </div>
      )}

      {/* ধাপ ৩: ভাড়া ও যোগাযোগ */}
      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label className="label">মাসিক ভাড়া (টাকা) *</label>
            <input
              type="number"
              min={1}
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="যেমন: 3500"
            />
          </div>
          <div>
            <label className="label">মোবাইল নম্বর *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <label className="label">বর্ণনা *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="রুমের সাইজ, ওয়াশরুম, খাবার/মিল সিস্টেম, নিয়মকানুন..."
              rows={4}
            />
          </div>
        </div>
      )}

      {/* ধাপ ৪: ছবি */}
      {step === 3 && (
        <div className="space-y-3">
          <label className="label">ছবি যোগ করুন (সর্বোচ্চ ৬টি, ঐচ্ছিক)</label>
          <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-emerald-500">
            <span className="text-4xl">📷</span>
            <span className="mt-2 font-semibold text-emerald-700">
              ছবি সিলেক্ট করুন
            </span>
            <span className="text-xs text-slate-500">
              রুমের আসল ছবি দিলে ভাড়া দ্রুত হয়
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onFiles}
            />
          </label>
          {previews.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">
                লাইভ প্রিভিউ ({previews.length}টি):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`প্রিভিউ ${i + 1}`}
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ধাপ ৫: রিভিউ */}
      {step === 4 && (
        <div className="space-y-2 text-sm">
          <h3 className="font-bold">একবার দেখে নিন:</h3>
          <div className="rounded-lg bg-slate-50 p-3 space-y-1">
            <p><b>শিরোনাম:</b> {title}</p>
            <p><b>ধরন:</b> {typeLabel(type)}</p>
            <p><b>এলাকা:</b> {thana} • {ward}</p>
            {address && <p><b>ঠিকানা:</b> {address}</p>}
            <p><b>ভাড়া:</b> ৳{Number(rent).toLocaleString("en-US")}/মাস</p>
            <p><b>মোবাইল:</b> {phone}</p>
            <p><b>বর্ণনা:</b> {description}</p>
            <p><b>ছবি:</b> {files.length}টি</p>
          </div>
          <p className="text-xs text-slate-500">
            ℹ️ বিজ্ঞাপন ৩০ দিন চালু থাকবে। মেয়াদ শেষে ড্যাশবোর্ড থেকে রিনিউ করতে পারবেন।
          </p>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}
      {!validStep() && hint() && (
        <p className="mt-3 text-sm text-amber-700">⚠️ {hint()}</p>
      )}

      <div className="mt-5 flex justify-between gap-2">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0 || busy}
          className="btn-secondary"
        >
          ← পেছনে
        </button>
        {step < 4 ? (
          <button
            onClick={() => validStep() && setStep((s) => s + 1)}
            disabled={!validStep() || busy}
            className="btn-primary"
          >
            পরের ধাপ →
          </button>
        ) : (
          <button onClick={submit} disabled={busy} className="btn-primary">
            {busy ? "পোস্ট হচ্ছে..." : "✅ বিজ্ঞাপন পোস্ট করুন"}
          </button>
        )}
      </div>
    </div>
  );
}
