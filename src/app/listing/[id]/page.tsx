import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";
import ListingDetail from "@/components/ListingDetail";

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data } = await supabase
    .from("listings")
    .select("*, listing_photos(*)")
    .eq("id", params.id)
    .single();

  if (!data) notFound();
  const listing = data as Listing;

  // ভিউ কাউন্ট বাড়াও (fire-and-forget)
  await supabase.rpc("increment_listing_views", { p_listing_id: params.id });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ListingDetail
      listing={{ ...listing, views: listing.views + 1 }}
      isOwner={!!user && user.id === listing.owner_id}
    />
  );
}
