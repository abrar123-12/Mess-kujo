import { createClient } from "@/lib/supabase/server";
import { requireNonAdmin } from "@/lib/requireRole";
import type {
  DashboardListing,
  Listing,
  Conversation,
  ConversationPreview,
} from "@/lib/types";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  // শুধু সাধারণ ইউজার — অ্যাডমিন হলে /admin এ পাঠিয়ে দেবে
  const userId = await requireNonAdmin("/dashboard");
  const supabase = createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  const withCounts: DashboardListing[] = await Promise.all(
    ((listings as Listing[]) || []).map(async (l) => {
      const [{ count: ic }, { count: nc }] = await Promise.all([
        supabase
          .from("inquiries")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", l.id),
        supabase
          .from("nudges")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", l.id),
      ]);
      return { ...l, inquiry_count: ic || 0, nudge_count: nc || 0 };
    })
  );

  // 💬 চ্যাট: আমার সব thread (মালিক + ভাড়াটিয়া হিসেবে)
  const { data: convs } = await supabase
    .from("conversations")
    .select("*, listings(title)")
    .or(`owner_id.eq.${userId},renter_id.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(50);

  const previews: ConversationPreview[] = await Promise.all(
    (
      (convs as (Conversation & {
        listings: { title: string } | null;
      })[]) || []
    ).map(async (c) => {
      const isOwner = c.owner_id === userId;
      const otherId = isOwner ? c.renter_id : c.owner_id;
      const [otherRes, lastRes, readRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("name")
          .eq("id", otherId)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("body,sender_id,created_at")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("conversation_reads")
          .select("last_read_at")
          .eq("conversation_id", c.id)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      const lastRead = (readRes.data as { last_read_at: string } | null)
        ?.last_read_at;
      let unreadQ = supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .neq("sender_id", userId);
      if (lastRead) unreadQ = unreadQ.gt("created_at", lastRead);
      const { count: unread } = await unreadQ;
      const last = lastRes.data as {
        body: string;
        sender_id: string;
        created_at: string;
      } | null;
      return {
        ...c,
        listing_title: c.listings?.title || "বিজ্ঞাপন",
        other_name:
          (otherRes.data as { name: string | null } | null)?.name || null,
        last_message_body: last?.body || null,
        last_message_sender_id: last?.sender_id || null,
        last_message_created_at: last?.created_at || null,
        unread_count: unread || 0,
        is_owner: isOwner,
      };
    })
  );

  const totalUnread = previews.reduce((s, c) => s + c.unread_count, 0);

  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="mb-1 text-2xl font-bold">📊 আমার ড্যাশবোর্ড</h1>
      <p className="mb-4 text-sm text-slate-600">
        আপনার বিজ্ঞাপন, চ্যাট ও স্ট্যাটাস এখানে দেখুন
      </p>
      <DashboardClient
        listings={withCounts}
        conversations={previews}
        totalUnread={totalUnread}
        userId={userId}
      />
    </div>
  );
}
