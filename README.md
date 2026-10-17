# মেস/সাবলেট খোঁজো (Mess Khojo)

A mess / sublet / room finder web app for **Chattogram city**, Bangladesh.
Bangla-first UI, mobile-first. Free-tier deploy: **Vercel + Supabase**.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres + Auth (email/password) + Storage (listing photos)
- No paid services

## Features

- Browse listings (photo, title, thana + ward, rent/month, type badge, favorites)
- Filters: thana (16 metro thanas), ward (41 CCC wards), type, search — no budget filter
- Listing detail: gallery, inquiry button (logs to DB), "still available?" nudge, view counter
- Multi-step post-ad form with photo upload + live preview (login required)
- Rental tracking: inquiries logged per listing, "mark as rented", 30-day auto-expiry + renew,
  per-listing views/inquiries/nudges in owner dashboard
- Admin panel (role-gated): all users, all listings, feature/boost listings, hide/delete
- Monetization-ready: `is_featured` / `featured_until` columns + featured badge & pinning

## Local setup

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + anon key
npm run dev
```

## Database setup (Supabase)

1. Create a free project at supabase.com
2. SQL Editor → run `supabase/schema.sql`
3. SQL Editor → run `supabase/seed.sql` (sample listings, delete later from /admin)
4. Storage bucket `listing-photos` is created by the schema (public)
5. Auth → Sign In/Up → turn **Confirm email OFF** (for easy testing)
6. After signing up on the site, make yourself admin:
   ```sql
   update profiles set role = 'admin' where id = 'YOUR-USER-UUID';
   ```
   (UUID: Supabase → Authentication → Users → copy)

## Deploy (Vercel, free)

1. Push this folder to a GitHub repo
2. vercel.com → Add New → Project → Import the repo
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy → live link 🎉

Full phone-friendly Bangla guide: see **DEPLOY-BN.md**.
