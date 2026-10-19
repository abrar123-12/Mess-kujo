import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "user";

/**
 * লগইন করা ইউজারের রোল বের করে।
 * লগইন না থাকলে null। প্রোফাইল না থাকলে/রোল অন্য কিছু হলে "user" ধরা হয়।
 */
export async function getSessionRole(): Promise<{
  userId: string;
  role: AppRole;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role: AppRole =
    (profile as { role: string } | null)?.role === "admin"
      ? "admin"
      : "user";
  return { userId: user.id, role };
}

/**
 * শুধু অ্যাডমিনদের জন্য গার্ড।
 * লগইন না থাকলে → /login?next=/admin
 * অ্যাডমিন না হলে → /dashboard (ইউজার কখনো অ্যাডমিন পেজ দেখবে না)
 */
export async function requireAdmin(): Promise<string> {
  const s = await getSessionRole();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "admin") redirect("/dashboard");
  return s.userId;
}

/**
 * শুধু সাধারণ ইউজারদের জন্য গার্ড।
 * লগইন না থাকলে → /login?next=<page>
 * অ্যাডমিন হলে → /admin (অ্যাডমিন কখনো ইউজার পেজ দেখবে না)
 */
export async function requireNonAdmin(next: string): Promise<string> {
  const s = await getSessionRole();
  if (!s) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (s.role === "admin") redirect("/admin");
  return s.userId;
}
