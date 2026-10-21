import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

const SITE_URL = "https://mess-kujo.vercel.app";
const SITE_TITLE = "মেস/সাবলেট খোঁজো | চট্টগ্রাম";
const SITE_DESC =
  "চট্টগ্রাম শহরে মেস সিট, সাবলেট ও রুম খুঁজুন — থানা ও ওয়ার্ড অনুযায়ী। সরাসরি মালিকের সাথে চ্যাট, সম্পূর্ণ ফ্রি, কোনো দালাল নেই!";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESC,
  keywords: [
    "মেস ভাড়া চট্টগ্রাম",
    "সাবলেট চট্টগ্রাম",
    "mess rent chattogram",
    "room rent chittagong",
    "bachelor mess chattogram",
  ],
  openGraph: {
    type: "website",
    locale: "bn_BD",
    url: SITE_URL,
    siteName: "মেস/সাবলেট খোঁজো",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "মেস/সাবলেট খোঁজো — চট্টগ্রামে মেস, সাবলেট ও রুম খুঁজুন",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        <main className="mx-auto max-w-6xl px-3 pb-20 md:px-4 md:pb-0">{children}</main>
        <footer className="border-t bg-white py-6 text-center text-sm text-slate-500">
          <p>🏠 মেস/সাবলেট খোঁজো — চট্টগ্রাম শহরের জন্য</p>
          <p className="mt-1 text-xs">
            সতর্কতা: অগ্রিম টাকা দেওয়ার আগে সরাসরি দেখে নিন
          </p>
        </footer>
      </body>
    </html>
  );
}
