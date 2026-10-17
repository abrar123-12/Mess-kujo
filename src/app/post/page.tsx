import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostAdForm from "@/components/PostAdForm";

export default async function PostPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/post");

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-4 text-2xl font-bold">📢 বিজ্ঞাপন দিন</h1>
      <p className="mb-4 text-sm text-slate-600">
        ৫টি সহজ ধাপে আপনার মেস সিট / সাবলেট / রুমের বিজ্ঞাপন দিন — সম্পূর্ণ ফ্রি
      </p>
      <PostAdForm userId={user.id} />
    </div>
  );
}
