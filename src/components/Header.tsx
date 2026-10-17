"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import NotificationBell from "@/components/NotificationBell";

export default function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [nearmeActive, setNearmeActive] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // রোল বের করো (অ্যাডমিন নাকি সাধারণ ইউজার)
  const fetchRole = async (uid: string | null) => {
    if (!uid) {
      setRole(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", uid)
      .maybeSingle();
    setRole(
      (data as { role: string } | null)?.role === "admin" ? "admin" : "user"
    );
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setLoggedIn(!!data.session);
      setUserId(uid);
      fetchRole(uid);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setLoggedIn(!!session);
      setUserId(uid);
      fetchRole(uid);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // কাছাকাছি ট্যাব active কিনা (query param দেখে)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setNearmeActive(
        pathname === "/" &&
          new URLSearchParams(window.location.search).get("nearme") === "1"
      );
    }
  }, [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setRole(null);
    setUserId(null);
    router.push("/");
    router.refresh();
  };

  const isAdmin = role === "admin";
  const accountHref = loggedIn ? "/dashboard" : "/login";

  const tabCls = (active: boolean) =>
    `flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] leading-tight ${
      active ? "font-bold text-emerald-700" : "text-slate-500"
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-emerald-700 text-white shadow">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-14 items-center justify-between gap-2">
            <Link href="/" className="text-lg font-bold whitespace-nowrap">
              🏠 মেস/সাবলেট খোঁজো
            </Link>
            {/* ডেস্কটপ নেভ — রোল অনুযায়ী (অ্যাডমিন কখনো ইউজার লিংক দেখবে না) */}
            <nav className="hidden items-center gap-1 text-sm md:flex">
              {loggedIn && userId && (
                <NotificationBell userId={userId} variant="desktop" />
              )}
              {loggedIn ? (
                isAdmin ? (
                  <>
                    <Link
                      href="/admin"
                      className="whitespace-nowrap rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-emerald-950 hover:bg-amber-300"
                    >
                      🛠️ অ্যাডমিন প্যানেল
                    </Link>
                    <Link
                      href="/feedback"
                      className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
                    >
                      💬 ফিডব্যাক
                    </Link>
                    <button
                      onClick={logout}
                      className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
                    >
                      লগআউট
                    </button>
                  </>
                ) : (
                  <>
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
                )
              ) : (
                <Link
                  href="/login"
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 hover:bg-emerald-600"
                >
                  লগইন
                </Link>
              )}
            </nav>
            {/* মোবাইলে শুধু লগইন/লগআউট — বাকি নেভিগেশন নিচের বারে */}
            <div className="md:hidden">
              {loggedIn ? (
                <button
                  onClick={logout}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold"
                >
                  লগআউট
                </button>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-bold"
                >
                  লগইন
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* মোবাইল বটম নেভিগেশন বার */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="মোবাইল নেভিগেশন"
      >
        <div
          className={`grid items-stretch ${
            loggedIn && userId && !isAdmin
              ? "grid-cols-6"
              : "grid-cols-5"
          }`}
        >
          <Link href="/" className={tabCls(pathname === "/" && !nearmeActive)}>
            <span className="text-xl">🏠</span>
            <span>হোম</span>
          </Link>
          <Link
            href="/?nearme=1"
            className={tabCls(pathname === "/" && nearmeActive)}
          >
            <span className="text-xl">📍</span>
            <span>কাছাকাছি</span>
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="flex min-h-[58px] flex-col items-center justify-start"
              aria-label="অ্যাডমিন প্যানেল"
            >
              <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-2xl text-emerald-950 shadow-lg ring-4 ring-white">
                🛠️
              </span>
              <span className="-mt-0.5 pb-1 text-[11px] font-bold text-slate-700">
                অ্যাডমিন
              </span>
            </Link>
          ) : (
            <Link
              href="/post"
              className="flex min-h-[58px] flex-col items-center justify-start"
              aria-label="বিজ্ঞাপন দিন"
            >
              <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-2xl text-emerald-950 shadow-lg ring-4 ring-white">
                ➕
              </span>
              <span className="-mt-0.5 pb-1 text-[11px] font-bold text-slate-700">
                বিজ্ঞাপন
              </span>
            </Link>
          )}
          {loggedIn && userId && (
            <NotificationBell userId={userId} variant="mobile" />
          )}
          <Link
            href="/feedback"
            className={tabCls(pathname === "/feedback")}
          >
            <span className="text-xl">💬</span>
            <span>ফিডব্যাক</span>
          </Link>
          {!isAdmin && (
            <Link
              href={accountHref}
              className={tabCls(
                pathname === "/dashboard" || pathname === "/login"
              )}
            >
              <span className="text-xl">👤</span>
              <span>অ্যাকাউন্ট</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
