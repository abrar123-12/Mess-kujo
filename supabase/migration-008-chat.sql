-- ============================================================
-- মেস/সাবলেট খোঁজো — মাইগ্রেশন ০০৮: ইন-অ্যাপ চ্যাট
-- ভাড়াটিয়া ↔ মালিক মেসেজিং (প্রতি লিস্টিং-এ প্রতি ভাড়াটিয়ার ১টা thread)
-- চালানোর নিয়ম: Supabase Dashboard → SQL Editor → New query
-- এই পুরো ফাইল পেস্ট করে "Run" চাপুন (একাধিকবার চালানো নিরাপদ)
-- ============================================================

-- ---------- ১. conversations টেবিল ----------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  renter_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  constraint conversations_no_self_chat check (owner_id <> renter_id),
  constraint conversations_unique_thread unique (listing_id, renter_id)
);
alter table public.conversations enable row level security;

-- ---------- ২. messages টেবিল ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) > 0 and char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

-- ---------- ৩. conversation_reads টেবিল (অপঠিত চিহ্ন) ----------
create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_reads enable row level security;

-- ---------- ৪. হেল্পার: লগইন করা ইউজার thread-এর অংশ কিনা ----------
create or replace function public.is_conversation_participant(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv_id
      and (c.owner_id = auth.uid() or c.renter_id = auth.uid())
  );
$$;

-- ---------- ৫. ট্রিগার: thread খুললে owner_id লিস্টিং থেকে অটো বসবে ----------
create or replace function public.set_conversation_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select l.owner_id into new.owner_id
  from public.listings l
  where l.id = new.listing_id;
  if new.owner_id is null then
    raise exception 'লিস্টিং পাওয়া যায়নি';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_conversation_owner on public.conversations;
create trigger trg_set_conversation_owner
  before insert on public.conversations
  for each row execute function public.set_conversation_owner();

-- ---------- ৬. ট্রিগার: মেসেজ এলে last_message_at আপডেট ----------
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_conversation on public.messages;
create trigger trg_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ---------- ৭. user_reports টেবিল (ইউজার রিপোর্ট) ----------
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  constraint no_self_report check (reporter_id <> reported_user_id)
);
alter table public.user_reports enable row level security;

-- ---------- ৮. RLS পলিসি ----------
-- conversations: শুধু অংশগ্রহণকারীরা (মালিক/ভাড়াটিয়া) দেখবে
drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
  on public.conversations for select
  using (owner_id = auth.uid() or renter_id = auth.uid());

-- conversations: অ্যাডমিন সব দেখবে (মনিটরিং)
drop policy if exists "Admins can view all conversations" on public.conversations;
create policy "Admins can view all conversations"
  on public.conversations for select
  using (public.is_admin());

-- conversations: লগইন করা ইউজার নিজে thread খুলতে পারবে (ভাড়াটিয়া হিসেবে)
-- (owner_id ট্রিগার বসিয়ে দেবে; নিজের লিস্টিং-এ নিজে খুলতে পারবে না)
drop policy if exists "Users can start conversations" on public.conversations;
create policy "Users can start conversations"
  on public.conversations for insert
  with check (renter_id = auth.uid());

-- messages: শুধু অংশগ্রহণকারীরা পড়বে
drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
  on public.messages for select
  using (public.is_conversation_participant(conversation_id));

-- messages: অংশগ্রহণকারী নিজের নামে পাঠাবে
drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id)
  );

-- messages: অ্যাডমিন সব দেখবে (মনিটরিং)
drop policy if exists "Admins can view all messages" on public.messages;
create policy "Admins can view all messages"
  on public.messages for select
  using (public.is_admin());

-- user_reports: লগইন করা ইউজার রিপোর্ট করতে পারবে (নিজের নামে)
drop policy if exists "Users can file reports" on public.user_reports;
create policy "Users can file reports"
  on public.user_reports for insert
  with check (reporter_id = auth.uid());

-- user_reports: অ্যাডমিন সব দেখবে
drop policy if exists "Admins can view all reports" on public.user_reports;
create policy "Admins can view all reports"
  on public.user_reports for select
  using (public.is_admin());

-- user_reports: অ্যাডমিন স্ট্যাটাস বদলাতে পারবে
drop policy if exists "Admins can update reports" on public.user_reports;
create policy "Admins can update reports"
  on public.user_reports for update
  using (public.is_admin());

-- conversation_reads: নিজেরটা নিজে ম্যানেজ করবে
drop policy if exists "Users manage own reads" on public.conversation_reads;
create policy "Users manage own reads"
  on public.conversation_reads for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- ৯. ইনডেক্স ----------
create index if not exists idx_conversations_owner
  on public.conversations (owner_id, last_message_at desc);
create index if not exists idx_conversations_renter
  on public.conversations (renter_id, last_message_at desc);
create index if not exists idx_conversations_listing
  on public.conversations (listing_id);
create index if not exists idx_messages_conversation
  on public.messages (conversation_id, created_at);
create index if not exists idx_conversation_reads_user
  on public.conversation_reads (user_id);

create index if not exists idx_user_reports_reporter
  on public.user_reports (reporter_id, created_at desc);
create index if not exists idx_user_reports_reported
  on public.user_reports (reported_user_id, created_at desc);

-- ---------- ১০. Realtime: নতুন মেসেজ লাইভ আসবে ----------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
