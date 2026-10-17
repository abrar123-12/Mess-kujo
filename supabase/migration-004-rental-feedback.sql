-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৪: ভাড়া-পরবর্তী রেটিং
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- NOTE: migration-003 এর পরে চালান
-- ============================================================

create table if not exists public.rental_feedback (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  rater_id uuid references public.profiles(id) on delete set null,
  stars int not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);
alter table public.rental_feedback enable row level security;

-- লগইন করা ইউজার নিজের নামে রেটিং দিতে পারবে
drop policy if exists "Authenticated users can submit rental feedback" on public.rental_feedback;
create policy "Authenticated users can submit rental feedback"
  on public.rental_feedback for insert
  with check (auth.uid() = rater_id);

-- শুধু অ্যাডমিন সব রেটিং দেখতে পারবে
drop policy if exists "Admins can view all rental feedback" on public.rental_feedback;
create policy "Admins can view all rental feedback"
  on public.rental_feedback for select
  using (public.is_admin());

create index if not exists idx_rental_feedback_created
  on public.rental_feedback (created_at desc);
create index if not exists idx_rental_feedback_listing
  on public.rental_feedback (listing_id);
