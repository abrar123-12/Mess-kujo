-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৫: ইউজার মডারেশন (স্থগিত)
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- NOTE: push-এর আগে বা পরে — যেকোনো সময় চালানো নিরাপদ
-- ============================================================

-- ---------- ১. profiles টেবিলে স্থগিত-সংক্রান্ত কলাম ----------
alter table public.profiles
  add column if not exists is_banned boolean not null default false;
alter table public.profiles
  add column if not exists banned_at timestamptz;

create index if not exists idx_profiles_is_banned
  on public.profiles (is_banned);

-- ---------- ২. অ্যাডমিন profiles আপডেট করতে পারবে (ban/unban/role) ----------
-- (schema.sql-এ ইতিমধ্যে আছে; এখানে idempotent ভাবে নিশ্চিত করা হলো)
drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
