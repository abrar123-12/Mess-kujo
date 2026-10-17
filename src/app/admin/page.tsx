import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  Listing,
  Profile,
  Feedback,
  Inquiry,
  RentalFeedback,
  Notification,
} from "@/lib/types";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== "admin") {
    return (
      <div className="mx-auto max-w-md py-16">
        <div className="card p-8 text-center">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-2 text-xl font-bold">অ্যাক্সেস নেই</h1>
          <p className="mt-1 text-sm text-slate-600">
            এই পেজ শুধু অ্যাডমিনদের জন্য।
          </p>
        </div>
      </div>
    );
  }

  const [{ data: users }, { data: listings }, { data: feedback }, { data: inquiries }, { data: ratings }, { data: notifications }] =
    await Promise.all([
      supabase.from("profiles").select("*").order("created_at", {
        ascending: false,
      }),
      supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("feedback")
        .select("*, profiles(name, phone)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("inquiries")
        .select("*, listings(title), profiles(name, phone)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("rental_feedback")
        .select("*, listings(title), profiles(name, phone)")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

  return (
    <div className="py-6">
      <h1 className="mb-1 text-2xl font-bold">🛠️ অ্যাডমিন প্যানেল</h1>
      <p className="mb-4 text-sm text-slate-600">
        ইউজার, লিস্টিং, ফিচার্ড/বুস্ট — সব এক জায়গায়
      </p>
      <AdminClient
        users={(users as Profile[]) || []}
        listings={(listings as Listing[]) || []}
        feedback={(feedback as Feedback[]) || []}
        inquiries={(inquiries as Inquiry[]) || []}
        ratings={(ratings as RentalFeedback[]) || []}
        notifications={(notifications as Notification[]) || []}
        currentUserId={user.id}
      />
    </div>
  );
}
