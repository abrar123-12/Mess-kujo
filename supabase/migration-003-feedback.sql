-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৩: ফিডব্যাক (ফিচার রিকোয়েস্ট)
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- NOTE: migration-002 এর পরে চালান (ক্রম জরুরি নয়, তবে ০০২ আগে)
-- ============================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'feature',
  message text not null,
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;

-- লগইন করা যে কেউ ফিডব্যাক পাঠাতে পারবে (নিজের নামে)
drop policy if exists "Authenticated users can submit feedback" on public.feedback;
create policy "Authenticated users can submit feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- শুধু অ্যাডমিন ফিডব্যাক দেখতে পারবে
drop policy if exists "Admins can view all feedback" on public.feedback;
create policy "Admins can view all feedback"
  on public.feedback for select
  using (public.is_admin());

create index if not exists idx_feedback_created
  on public.feedback (created_at desc);
