"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(!!data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-emerald-700 text-white shadow">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-2">
          <Link href="/" className="text-lg font-bold whitespace-nowrap">
            🏠 মেস/সাবলেট খোঁজো
          </Link>
          <nav className="flex items-center gap-1 text-sm overflow-x-auto">
            <Link
              href="/post"
              className="whitespace-nowrap rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-emerald-950 hover:bg-amber-300"
            >
              + বিজ্ঞাপন দিন
            </Link>
            <Link
              href="/feedback"
              className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
            >
              💬 ফিডব্যাক
            </Link>
            {loggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
                >
                  ড্যাশবোর্ড
                </Link>
                <button
                  onClick={logout}
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
                >
                  লগআউট
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
              >
                লগইন
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
