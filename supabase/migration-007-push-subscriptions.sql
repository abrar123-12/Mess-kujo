-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৭: রিয়েল পুশ নোটিফিকেশন
-- ফোনে নোটিফিকেশন পাঠাতে প্রত্যেক ইউজারের push subscription এখানে জমা থাকবে
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- ============================================================

-- ---------- ১. push_subscriptions টেবিল ----------
create table if not exists public.push_subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

-- ---------- ২. RLS পলিসি: শুধু নিজের subscription দেখা/বসানো/মোছা যাবে ----------
drop policy if exists "Users can manage own push subscription" on public.push_subscriptions;
create policy "Users can manage own push subscription"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- ৩. অ্যাডমিন পুশ পাঠানোর সময় সবার subscription পড়তে পারবে ----------
drop policy if exists "Admins can view push subscriptions" on public.push_subscriptions;
create policy "Admins can view push subscriptions"
  on public.push_subscriptions for select
  using (public.is_admin());
