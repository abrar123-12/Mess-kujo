import { requireNonAdmin } from "@/lib/requireRole";
import PostAdForm from "@/components/PostAdForm";

export default async function PostPage() {
  // শুধু সাধারণ ইউজার — অ্যাডমিন হলে /admin এ পাঠিয়ে দেবে
  const userId = await requireNonAdmin("/post");

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-4 text-2xl font-bold">📢 বিজ্ঞাপন দিন</h1>
      <p className="mb-4 text-sm text-slate-600">
        ৫টি সহজ ধাপে আপনার মেস সিট / সাবলেট / রুমের বিজ্ঞাপন দিন — সম্পূর্ণ ফ্রি
      </p>
      <PostAdForm userId={userId} />
    </div>
  );
}
