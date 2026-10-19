import { createClient } from "@/lib/supabase/client";

type SupaClient = ReturnType<typeof createClient>;

export const BANNED_MESSAGE =
  "⛔ আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সহায়তার জন্য যোগাযোগ করুন।";

export type ActiveUserResult =
  | { ok: true; userId: string }
  | { ok: false; banned: boolean };

/**
 * লগইন করা ইউজার সক্রিয় (স্থগিত নয়) কিনা যাচাই করে।
 * স্থগিত হলে সাথে সাথে সাইন-আউট করে দেয়।
 * Mutation (বিজ্ঞাপন/ফিডব্যাক/যোগাযোগ) চালানোর আগে ব্যবহার করুন।
 */
export async function checkActiveUser(
  supabase: SupaClient
): Promise<ActiveUserResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, banned: false };
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && (profile as { is_banned: boolean }).is_banned) {
    await supabase.auth.signOut();
    return { ok: false, banned: true };
  }
  return { ok: true, userId: user.id };
}
