import { createClient } from "@/lib/supabase/server";
import { requireNonAdmin } from "@/lib/requireRole";
import type { DashboardListing, Listing } from "@/lib/types";
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

  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="mb-1 text-2xl font-bold">📊 আমার ড্যাশবোর্ড</h1>
      <p className="mb-4 text-sm text-slate-600">
        আপনার বিজ্ঞাপনগুলোর ভিউ, যোগাযোগ ও স্ট্যাটাস এখানে দেখুন
      </p>
      <DashboardClient listings={withCounts} />
    </div>
  );
}
