import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webPush from "web-push";

// POST: অ্যাডমিন-শুধু — পুশ নোটিফিকেশন পাঠানো
// body: { title, message, target_user_id?: string | null, url?: string }
export async function POST(req: Request) {
  // VAPID key না থাকলে চুপচাপ skip (in-app নোটিফিকেশন তো আছেই)
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey)
    return NextResponse.json(
      { ok: false, skipped: true, reason: "VAPID key বসানো নেই" },
      { status: 200 }
    );

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "লগইন করুন" }, { status: 401 });

  // অ্যাডমিন চেক
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if ((profile as { role?: string } | null)?.role !== "admin")
    return NextResponse.json({ error: "অনুমতি নেই" }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "ভুল ডেটা" }, { status: 400 });
  }
  const title: string = (body?.title || "🔔 মেস/সাবলেট খোঁজো").toString();
  const message: string = (body?.message || "").toString();
  const targetUserId: string | null = body?.target_user_id || null;
  const url: string = body?.url || "/";
  if (!message)
    return NextResponse.json({ error: "মেসেজ লিখুন" }, { status: 400 });

  // টার্গেট অনুযায়ী subscription নাও
  let q = supabase.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
  if (targetUserId) q = q.eq("user_id", targetUserId);
  const { data: subs, error } = await q;
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subs || subs.length === 0)
    return NextResponse.json({ ok: true, sent: 0, note: "কেউ subscribe করেনি" });

  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@mess-khojo.local",
    publicKey,
    privateKey
  );

  const payload = JSON.stringify({ title, message, url });
  let sent = 0;
  const deadEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webPush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (e: any) {
        // 404/410 = ডিভাইস আর নেই → তালিকা থেকে বাদ
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          deadEndpoints.push(s.endpoint);
        }
      }
    })
  );

  if (deadEndpoints.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("endpoint", deadEndpoints);
  }

  return NextResponse.json({ ok: true, sent, pruned: deadEndpoints.length });
}
