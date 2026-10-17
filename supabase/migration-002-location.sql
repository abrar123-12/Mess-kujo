-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০২: লোকেশন (lat/lng)
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- ============================================================

-- ---------- ১. listings টেবিলে lat/lng কলাম ----------
alter table public.listings
  add column if not exists lat double precision;
alter table public.listings
  add column if not exists lng double precision;

create index if not exists idx_listings_lat_lng
  on public.listings (lat, lng);

-- ---------- ২. nearby_listings RPC (PostGIS ছাড়া, haversine) ----------
-- ব্যবহার: supabase.rpc("nearby_listings", { user_lat, user_lng, radius_km })
drop function if exists public.nearby_listings(double precision, double precision, double precision);

create function public.nearby_listings(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 5
)
returns table (
  id uuid,
  owner_id uuid,
  title text,
  type text,
  thana text,
  ward text,
  address text,
  rent integer,
  phone text,
  description text,
  status text,
  is_featured boolean,
  featured_until timestamptz,
  views integer,
  expires_at timestamptz,
  created_at timestamptz,
  lat double precision,
  lng double precision,
  distance_km double precision
)
language sql
stable
set search_path = public
as $$
  select * from (
    select
      l.id, l.owner_id, l.title, l.type, l.thana, l.ward, l.address,
      l.rent, l.phone, l.description, l.status, l.is_featured,
      l.featured_until, l.views, l.expires_at, l.created_at,
      l.lat, l.lng,
      (
        6371 * acos(
          least(1.0, greatest(-1.0,
            cos(radians(user_lat)) * cos(radians(l.lat)) *
            cos(radians(l.lng) - radians(user_lng)) +
            sin(radians(user_lat)) * sin(radians(l.lat))
          ))
        )
      ) as distance_km
    from public.listings l
    where l.status = 'active'
      and l.expires_at > now()
      and l.lat is not null
      and l.lng is not null
  ) s
  where s.distance_km <= radius_km
  order by s.distance_km asc;
$$;
