import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireNonAdmin } from "@/lib/requireRole";
import type { ChatMessage, Conversation } from "@/lib/types";
import ChatWindow from "@/components/ChatWindow";

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  // শুধু সাধারণ ইউজার — অ্যাডমিন হলে /admin এ পাঠিয়ে দেবে
  const userId = await requireNonAdmin(`/chat/${params.id}`);
  const supabase = createClient();

  // thread + অংশগ্রহণ যাচাই (RLS নিজেই ব্লক করবে)
  const { data: conv } = await supabase
    .from("conversations")
    .select("*, listings(title)")
    .eq("id", params.id)
    .maybeSingle();

  if (!conv) notFound();
  const c = conv as Conversation & { listings: { title: string } | null };

  const otherUserId = c.owner_id === userId ? c.renter_id : c.owner_id;

  // অপর পক্ষের নাম + লিস্টিং শিরোনাম
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", otherUserId)
    .maybeSingle();

  // মেসেজ
  const { data: msgs } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", params.id)
    .order("created_at", { ascending: true })
    .limit(200);

  // পড়া হিসেবে চিহ্নিত (সার্ভারেও — লিস্টে unread সাথে সাথে কমবে)
  await supabase.from("conversation_reads").upsert(
    {
      conversation_id: params.id,
      user_id: userId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id,user_id" }
  );

  return (
    <div className="mx-auto max-w-3xl py-4">
      <ChatWindow
        conversationId={params.id}
        currentUserId={userId}
        otherUserId={otherUserId}
        otherName={(otherProfile as { name: string | null } | null)?.name ?? null}
        listingTitle={c.listings?.title || "বিজ্ঞাপন"}
        initialMessages={(msgs as ChatMessage[]) || []}
      />
      <p className="mt-2 text-center text-xs text-slate-400">
        ⚠️ অগ্রিম টাকা দেওয়ার আগে সরাসরি দেখে নিন • সন্দেহ হলে 🚩 রিপোর্ট করুন
      </p>
    </div>
  );
}
