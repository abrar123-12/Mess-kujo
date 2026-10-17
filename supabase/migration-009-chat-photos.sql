-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৯: চ্যাটে ছবি পাঠানো
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- ============================================================

-- ---------- ১. messages টেবিলে image_url কলাম ----------
alter table public.messages
  add column if not exists image_url text;

-- ---------- ২. body চেক: ছবি থাকলে খালি text চলবে ----------
-- (আগের চেক: body খালি হতে পারবে না)
alter table public.messages
  drop constraint if exists messages_body_check;
alter table public.messages
  add constraint messages_body_check
  check (
    char_length(body) <= 2000
    and (char_length(body) > 0 or image_url is not null)
  );

-- ---------- ৩. chat-photos Storage bucket (পাবলিক) ----------
insert into storage.buckets (id, name, public)
values ('chat-photos', 'chat-photos', true)
on conflict (id) do nothing;

-- সবাই ছবি দেখতে পারবে
drop policy if exists "Public can view chat photos" on storage.objects;
create policy "Public can view chat photos"
  on storage.objects for select
  using (bucket_id = 'chat-photos');

-- লগইন করা ইউজার ছবি আপলোড করতে পারবে
drop policy if exists "Logged-in users can upload chat photos" on storage.objects;
create policy "Logged-in users can upload chat photos"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-photos'
    and auth.role() = 'authenticated'
  );

-- নিজের আপলোড করা ছবি ডিলিট করতে পারবে
drop policy if exists "Users can delete own chat photos" on storage.objects;
create policy "Users can delete own chat photos"
  on storage.objects for delete
  using (bucket_id = 'chat-photos');
