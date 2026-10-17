-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৬: অ্যাডমিন নোটিফিকেশন
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- কাজ: অ্যাডমিন সবাইকে (ব্রডকাস্ট) বা নির্দিষ্ট ইউজারকে নোটিশ
-- পাঠাতে পারবে; ইউজাররা 🔔 বেল আইকনে নোটিশ দেখবে
-- ============================================================

-- ---------- ১. notifications টেবিল ----------
-- target_user_id NULL মানে: সব ইউজারের জন্য (ব্রডকাস্ট)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  target_user_id uuid references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

-- ---------- ২. notification_reads টেবিল (কে কোন নোটিশ পড়েছে) ----------
create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);
alter table public.notification_reads enable row level security;

-- ---------- ৩. notifications পলিসি ----------
-- শুধু অ্যাডমিন নোটিশ পাঠাতে পারবে
drop policy if exists "Admins can send notifications" on public.notifications;
create policy "Admins can send notifications"
  on public.notifications for insert
  with check (public.is_admin());

-- অ্যাডমিন সব নোটিশ দেখতে পারবে
drop policy if exists "Admins can view all notifications" on public.notifications;
create policy "Admins can view all notifications"
  on public.notifications for select
  using (public.is_admin());

-- লগইন করা ইউজার শুধু নিজের নোটিশ দেখবে
-- (ব্রডকাস্ট = target_user_id NULL, অথবা যেটা তাকে টার্গেট করে পাঠানো)
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (target_user_id is null or target_user_id = auth.uid());

-- শুধু অ্যাডমিন নোটিশ ডিলিট করতে পারবে
drop policy if exists "Admins can delete notifications" on public.notifications;
create policy "Admins can delete notifications"
  on public.notifications for delete
  using (public.is_admin());

-- ---------- ৪. notification_reads পলিসি ----------
-- ইউজার শুধু নিজের পড়া মার্ক করতে পারবে
drop policy if exists "Users can mark own notifications read" on public.notification_reads;
create policy "Users can mark own notifications read"
  on public.notification_reads for insert
  with check (auth.uid() = user_id);

-- ইউজার শুধু নিজের পড়ার রেকর্ড দেখবে
drop policy if exists "Users can view own reads" on public.notification_reads;
create policy "Users can view own reads"
  on public.notification_reads for select
  using (auth.uid() = user_id);

-- অ্যাডমিন সবার পড়ার রেকর্ড দেখতে পারবে
drop policy if exists "Admins can view all reads" on public.notification_reads;
create policy "Admins can view all reads"
  on public.notification_reads for select
  using (public.is_admin());

-- ---------- ৫. ইনডেক্স ----------
create index if not exists idx_notifications_target_created
  on public.notifications (target_user_id, created_at desc);
create index if not exists idx_notification_reads_user
  on public.notification_reads (user_id);
