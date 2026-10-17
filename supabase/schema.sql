-- ============================================================
-- মেস/সাবলেট খোঁজো — Supabase ডাটাবেজ স্কিমা
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন
-- ============================================================

-- ---------- ১. profiles (ইউজার তথ্য) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  phone text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- ---------- ১ব. হেলপার: অ্যাডমিন চেক (profiles টেবিলের পরে) ----------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- নিজের role নিজে বদলাতে পারবে না (শুধু অ্যাডমিন পারবে)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role is not distinct from (
      select p.role from public.profiles p where p.id = profiles.id
    )
  );

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- সাইনআপ করলেই profiles রো অটো তৈরি হবে
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- ৩. listings (বিজ্ঞাপন) ----------
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  type text not null check (type in ('mess_seat', 'sublet', 'room')),
  thana text not null,
  ward text not null,
  address text,
  rent integer not null check (rent > 0),
  phone text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'rented', 'expired')),
  -- মনিটাইজেশন: ফিচার্ড/বুস্ট
  is_featured boolean not null default false,
  featured_until timestamptz,
  -- ট্র্যাকিং
  views integer not null default 0,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);
alter table public.listings enable row level security;

drop policy if exists "Anyone can view active listings" on public.listings;
create policy "Anyone can view active listings"
  on public.listings for select
  using (status = 'active' and expires_at > now());

drop policy if exists "Owners can view own listings" on public.listings;
create policy "Owners can view own listings"
  on public.listings for select
  using (auth.uid() = owner_id);

drop policy if exists "Admins can view all listings" on public.listings;
create policy "Admins can view all listings"
  on public.listings for select
  using (public.is_admin());

drop policy if exists "Logged-in users can post listings" on public.listings;
create policy "Logged-in users can post listings"
  on public.listings for insert
  with check (auth.uid() = owner_id);

-- মালিক নিজের লিস্টিং এডিট করতে পারবে, কিন্তু featured ফিল্ড ছুঁতে পারবে না
drop policy if exists "Owners can update own listings" on public.listings;
create policy "Owners can update own listings"
  on public.listings for update
  using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and is_featured is not distinct from (
      select l.is_featured from public.listings l where l.id = listings.id
    )
    and featured_until is not distinct from (
      select l.featured_until from public.listings l where l.id = listings.id
    )
  );

drop policy if exists "Admins can update all listings" on public.listings;
create policy "Admins can update all listings"
  on public.listings for update
  using (public.is_admin());

drop policy if exists "Owners can delete own listings" on public.listings;
create policy "Owners can delete own listings"
  on public.listings for delete
  using (auth.uid() = owner_id);

drop policy if exists "Admins can delete all listings" on public.listings;
create policy "Admins can delete all listings"
  on public.listings for delete
  using (public.is_admin());

-- ---------- ৪. listing_photos ----------
create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.listing_photos enable row level security;

drop policy if exists "Public can view listing photos" on public.listing_photos;
create policy "Public can view listing photos"
  on public.listing_photos for select
  using (true);

drop policy if exists "Listing owners can add photos" on public.listing_photos;
create policy "Listing owners can add photos"
  on public.listing_photos for insert
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.owner_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Listing owners can delete photos" on public.listing_photos;
create policy "Listing owners can delete photos"
  on public.listing_photos for delete
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.owner_id = auth.uid() or public.is_admin())
    )
  );

-- ---------- ৫. inquiries (যোগাযোগ রেকর্ড) ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  from_user_id uuid references public.profiles(id) on delete set null,
  message text,
  created_at timestamptz not null default now()
);
alter table public.inquiries enable row level security;

drop policy if exists "Logged-in users can send inquiries" on public.inquiries;
create policy "Logged-in users can send inquiries"
  on public.inquiries for insert
  with check (auth.uid() = from_user_id);

drop policy if exists "Owners and admins can view inquiries" on public.inquiries;
create policy "Owners and admins can view inquiries"
  on public.inquiries for select
  using (
    auth.uid() = from_user_id
    or public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = inquiries.listing_id and l.owner_id = auth.uid()
    )
  );

-- ---------- ৬. nudges ("এখনো খালি আছে?") ----------
create table if not exists public.nudges (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  from_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (listing_id, from_user_id)
);
alter table public.nudges enable row level security;

drop policy if exists "Logged-in users can nudge" on public.nudges;
create policy "Logged-in users can nudge"
  on public.nudges for insert
  with check (auth.uid() = from_user_id);

drop policy if exists "Owners and admins can view nudges" on public.nudges;
create policy "Owners and admins can view nudges"
  on public.nudges for select
  using (
    auth.uid() = from_user_id
    or public.is_admin()
    or exists (
      select 1 from public.listings l
      where l.id = nudges.listing_id and l.owner_id = auth.uid()
    )
  );

-- ---------- ৭. ভিউ কাউন্ট ফাংশন ----------
create or replace function public.increment_listing_views(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings set views = views + 1 where id = p_listing_id;
end;
$$;

-- ---------- ৮. ছবির Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public can view listing photos" on storage.objects;
create policy "Public can view listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

drop policy if exists "Logged-in users can upload listing photos" on storage.objects;
create policy "Logged-in users can upload listing photos"
  on storage.objects for insert
  with check (
    bucket_id = 'listing-photos'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can update own listing photos" on storage.objects;
create policy "Users can update own listing photos"
  on storage.objects for update
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own listing photos" on storage.objects;
create policy "Users can delete own listing photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------- ৯. পারফরম্যান্স ইনডেক্স ----------
create index if not exists idx_listings_status_expires
  on public.listings (status, expires_at);
create index if not exists idx_listings_thana on public.listings (thana);
create index if not exists idx_listings_ward on public.listings (ward);
create index if not exists idx_listings_owner on public.listings (owner_id);
create index if not exists idx_photos_listing on public.listing_photos (listing_id);
create index if not exists idx_inquiries_listing on public.inquiries (listing_id);
create index if not exists idx_nudges_listing on public.nudges (listing_id);
