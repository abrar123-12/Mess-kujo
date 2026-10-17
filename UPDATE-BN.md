# 🔄 আপডেট নোট — নতুন ৪টি ফিচার

## কী কী যোগ হলো

### ১. 📍 ম্যাপ লোকেশন + "আমার কাছাকাছি" খোঁজা
- বিজ্ঞাপন দেওয়ার সময় **লোকেশন ধাপ** যোগ হয়েছে (ঐচ্ছিক) — ম্যাপে ট্যাপ করে পিন বসান, পিন টেনে সরানো যায়, "আমার বর্তমান লোকেশন" বাটন আছে
- হোমপেজে **"📍 আমার কাছাকাছি"** বাটন — চাপলে আপনার লোকেশন নিয়ে ২/৫/১০ কিমি ব্যাসার্ধে কাছের বিজ্ঞাপন দূরত্ব অনুযায়ী সাজিয়ে দেখাবে (কার্ডে "📍 ২.৩ কিমি" ব্যাজ)
- বিজ্ঞাপনের ডিটেইল পেজে **"🗺️ গুগল ম্যাপে দেখুন"** বাটন (লোকেশন থাকলে)
- ম্যাপ সম্পূর্ণ ফ্রি (OpenStreetMap) — কোনো API key লাগে না

### ২. 💬 ফিডব্যাক (ফিচার রিকোয়েস্ট)
- হেডারে **"💬 ফিডব্যাক"** লিংক — নতুন `/feedback` পেজ
- ফর্ম: ধরন (ফিচার রিকোয়েস্ট / সমস্যা / মতামত) + মতামত (কমপক্ষে ১০ অক্ষর)
- লগইন ছাড়া গেলে লগইন পেজে পাঠাবে; পাঠানোর পর ধন্যবাদ মেসেজ
- অ্যাডমিন প্যানেলে **"💬 ফিডব্যাক"** ট্যাবে সব মতামত দেখা যাবে (নতুন আগে, নাম+ফোনসহ)

### ৩. 📞 যোগাযোগ (inquiry) রিপোর্ট — অ্যাডমিন প্যানেলে
- অ্যাডমিন প্যানেলে নতুন **"📞 যোগাযোগ"** ট্যাব
- উপরে: প্রতি লিস্টিংয়ে মোট কতবার যোগাযোগ হয়েছে (সবচেয়ে বেশি আগে)
- নিচে: বিস্তারিত তালিকা — কোন বিজ্ঞাপন → কে (নাম) → ফোন নম্বর → তারিখ/সময় (নতুন আগে)

### ৪. ⭐ ভাড়া-পরবর্তী রেটিং
- মালিক **"✅ ভাড়া হয়ে গেছে"** চাপলে এখন ছোট্ট প্রম্পট আসবে: "অভিজ্ঞতা কেমন ছিল?" — ১–৫ স্টার + ঐচ্ছিক কমেন্ট + "পাঠান" / "বাদ দিন"
- অ্যাডমিন প্যানেলে **"⭐ রেটিং"** ট্যাবে সব রেটিং: বিজ্ঞাপন, স্টার, কমেন্ট, কার নাম, তারিখ

---

## ⚠️ Supabase-এ ৩টি SQL ফাইল চালাতে হবে (ক্রমানুসারে!)

Supabase Dashboard → **SQL Editor** → **New query** → ফাইলের পুরো কোড পেস্ট করে → **Run**

| ক্রম | ফাইল | কাজ |
|-----|------|-----|
| ১ম | `supabase/migration-002-location.sql` | listings-এ lat/lng কলাম + nearby_listings ফাংশন |
| ২য় | `supabase/migration-003-feedback.sql` | feedback টেবিল |
| ৩য় | `supabase/migration-004-rental-feedback.sql` | rental_feedback টেবিল |

> প্রতিটি ফাইল একাধিকবার চালানো নিরাপদ।

---

## 🚀 ডিপ্লয়

কোড GitHub-এ push করলেই Vercel **অটো-ডিপ্লয়** করবে — আলাদা কিছু করতে হবে না।

```bash
cd ~/storage/downloads/mess-khojo-full/mess-khojo
# নতুন ফাইলগুলো কপি/আপডেট করুন, তারপর:
git add -A
git commit -m "4 new features: map, feedback, inquiry stats, ratings"
git push origin main
```

> ⚠️ আগে Supabase-এ ৩টি migration চালিয়ে নিন, তারপর push করুন।

## 📁 বদলানো/নতুন ফাইল

**নতুন:**
- `src/components/LocationPicker.tsx` — ম্যাপ লোকেশন পিকার
- `src/app/feedback/page.tsx` — ফিডব্যাক ফর্ম পেজ
- `src/leaflet-css.d.ts` — TypeScript ডিক্লারেশন
- `supabase/migration-002-location.sql`
- `supabase/migration-003-feedback.sql`
- `supabase/migration-004-rental-feedback.sql`

**বদলানো:**
- `src/components/PostAdForm.tsx` — লোকেশন ধাপ (৬ ধাপ)
- `src/app/page.tsx` — "আমার কাছাকাছি" + ব্যাসার্ধ
- `src/components/ListingCard.tsx` — দূরত্ব ব্যাজ
- `src/components/ListingDetail.tsx` — গুগল ম্যাপ বাটন
- `src/components/Header.tsx` — ফিডব্যাক লিংক
- `src/components/DashboardClient.tsx` — রেটিং প্রম্পট
- `src/components/AdminClient.tsx` — ৫টি ট্যাব
- `src/app/admin/page.tsx` — নতুন ডেটা ফেচ
- `src/lib/types.ts` — lat/lng + নতুন টাইপ
- `package.json` — leaflet যোগ
