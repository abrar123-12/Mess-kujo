# 🏠 মেস/সাবলেট খোঁজো — ডিপ্লয় গাইড (বাংলা)

এই গাইড ফলো করলে ~৩০-৪০ মিনিটে তোমার ওয়েবসাইট লাইভ হয়ে যাবে — **সম্পূর্ণ ফ্রি**।
সব কাজ ফোনের ব্রাউজারেই করা যায়, শুধু ৫ নম্বর ধাপে (কোড GitHub-এ তোলা) PC থাকলে সবচেয়ে সহজ।

---

## ধাপ ১: Supabase অ্যাকাউন্ট খোলো (ডাটাবেজ + লগইন, ফ্রি)

1. ফোনের ব্রাউজারে যাও: **supabase.com**
2. **"Start your project"** চাপো → Google/GitHub দিয়ে সাইন আপ করো (ফ্রি, কার্ড লাগে না)
3. Dashboard-এ **"New project"** চাপো
4. ফর্ম পূরণ করো:
   - Name: `mess-khojo`
   - Database Password: একটা শক্ত পাসওয়ার্ড দাও (নোট করে রাখো)
   - Region: **Singapore** (বাংলাদেশের সবচেয়ে কাছে)
5. **"Create new project"** → ২ মিনিট অপেক্ষা করো ☕

## ধাপ ২: ডাটাবেজ টেবিল বানাও

1. বাম মেনুতে **SQL Editor** → **"New query"**
2. এই প্রজেক্টের `supabase/schema.sql` ফাইলটা খুলে **পুরো লেখা কপি** করো
3. Supabase-এর খালি এডিটরে **পেস্ট** করে **"Run"** ▶️ চাপো
4. নিচে "Success" দেখালে ✅ হয়ে গেছে

## ধাপ ৩: নমুনা বিজ্ঞাপন ঢোকাও (যাতে সাইট খালি না দেখায়)

1. আবার **SQL Editor → New query**
2. `supabase/seed.sql` ফাইলের পুরো লেখা কপি → পেস্ট → **Run**
3. ৮টা নমুনা বিজ্ঞাপন ঢুকে যাবে। আসল ইউজার এলে `/admin` পেজ থেকে ডিলিট করে দিও।

## ধাপ ৪: ছবির জায়গা চেক করো

1. বাম মেনুতে **Storage** চাপো
2. `listing-photos` নামে একটা bucket দেখা যাবে (schema.sql থেকেই বানানো) ✅
3. না দেখা গেলে: **New bucket** → নাম `listing-photos` → **Public** ON করে Create

## ধাপ ৫: লগইন সহজ করো (খুব গুরুত্বপূর্ণ!)

1. বাম মেনুতে **Authentication** → **Sign In / Up**
2. **"Confirm email"** অপশনটা **OFF** করে দাও
3. (নইলে সাইনআপের পর ইমেইলে লিংকে ক্লিক না করা পর্যন্ত লগইন হবে না)

## ধাপ ৬: কোড GitHub-এ তোলো

### অপশন A — PC থাকলে (সবচেয়ে সহজ, ৫ মিনিট)

1. **github.com** → **New repository** → নাম `mess-khojo` → **Create repository**
2. PC-তে `mess-khojo` ফোল্ডারে টার্মিনাল খুলে:
   ```bash
   git init
   git add .
   git commit -m "mess khojo v1"
   git branch -M main
   git remote add origin https://github.com/তোমার-ইউজারনেম/mess-khojo.git
   git push -u origin main
   ```
   (ইউজারনেম-পাসওয়ার্ড চাইলে GitHub-এর Personal Access Token ব্যবহার করো)

### অপশন B — শুধু ফোনে (Termux দিয়ে)

1. Play Store থেকে **Termux** ইনস্টল করো
2. Termux-এ একে একে চালাও:
   ```bash
   pkg install git -y
   git config --global user.name "তোমার নাম"
   git config --global user.email "তোমার@ইমেইল.com"
   ```
3. প্রথমে github.com-এ `mess-khojo` নামে খালি repo বানাও (অপশন A-এর ১ নম্বর)
4. ZIP ফাইলটা (`mess-khojo-deploy.zip`) ফোনে ডাউনলোড করে আনজিপ করো, তারপর:
   ```bash
   cd ~/mess-khojo
   git init
   git add .
   git commit -m "mess khojo v1"
   git branch -M main
   git remote add origin https://github.com/তোমার-ইউজারনেম/mess-khojo.git
   git push -u origin main
   ```

## ধাপ ৭: Vercel-এ ডিপ্লয় করো (ফোনেই করা যায়!)

1. **vercel.com** → **Sign Up** → **"Continue with GitHub"**
2. **"Add New..." → "Project"**
3. `mess-khojo` repo-র পাশে **Import** চাপো
4. **Environment Variables** সেকশনে ২টা যোগ করো:
   - `NEXT_PUBLIC_SUPABASE_URL` =
     👉 Supabase → **Settings (⚙️)** → **API** → **Project URL** (কপি-পেস্ট)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` =
     👉 একই পেজে **"anon public"** key (কপি-পেস্ট)
5. **Deploy** চাপো → ২-৩ মিনিট অপেক্ষা → 🎉 **লাইভ লিংক পেয়ে যাবা!**
   (যেমন: `mess-khojo.vercel.app` — এই লিংক সবাই খুলতে পারবে)

## ধাপ ৮: নিজেকে Admin বানাও

1. তোমার লাইভ সাইটে গিয়ে **Sign up** করো (নাম, ফোন, ইমেইল, পাসওয়ার্ড)
2. Supabase → **Authentication** → **Users** → তোমার ইমেইলের পাশে **UID কপি** করো
3. **SQL Editor → New query** → লেখো:
   ```sql
   update profiles set role = 'admin' where id = 'এখানে-UID-পেস্ট-করো';
   ```
   → **Run**
4. এখন সাইটের `/admin` পেজে ঢুকতে পারবা — সব ইউজার, সব লিস্টিং, ফিচার্ড/হাইড/ডিলিট সব এখানে 👑

## ধাপ ৯: টেস্ট করো ✅

1. সাইটে **বিজ্ঞাপন দাও** (ছবিসহ) → হোমপেজে দেখা যাচ্ছে কিনা দেখো
2. অন্য ব্রাউজার/Incognito থেকে **যোগাযোগ করুন** চাপো → ড্যাশবোর্ডে কাউন্ট বাড়ছে কিনা দেখো
3. ড্যাশবোর্ড থেকে **"ভাড়া হয়ে গেছে"** চাপো → লিস্টিং হাইড হয় কিনা দেখো
4. **"এখনো খালি আছে?"** চাপো → মালিকের ড্যাশবোর্ডে নোটিফিকেশন কাউন্ট দেখো

## সমস্যা হলে 🛠️

| সমস্যা | সমাধান |
|---|---|
| সাইট খুলে সাদা পেজ / এরর | Vercel → Project → **Settings → Environment Variables** — ২টা key ঠিক আছে কিনা দেখো → **Redeploy** |
| সাইনআপের পর লগইন হয় না | Supabase → Authentication → **Confirm email OFF** করো (ধাপ ৫) |
| ছবি আপলোড হয় না | Supabase → Storage → `listing-photos` bucket **Public** কিনা দেখো |
| `/admin` ঢুকতে পারি না | ধাপ ৮-এর SQL আবার চালাও — UID ঠিক কপি হয়েছে কিনা দেখো |

## পরে যা করতে পারো (আয় বাড়াতে)

- **Boost/ফিচার্ডের দাম** ঠিক করে `is_featured` চালু করো (অ্যাডমিন প্যানেলেই বাটন আছে)
- bKash/Nagad-এ পেমেন্ট নিয়ে ম্যানুয়ালি ফিচার্ড করে দাও (v1-এর জন্য এটাই সহজ)
- ফেসবুক গ্রুপে লিংক শেয়ার করে প্রথম ১০০ ইউজার আনো

শুভকামনা! 🚀
