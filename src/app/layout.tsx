import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "মেস/সাবলেট খোঁজো | চট্টগ্রাম",
  description:
    "চট্টগ্রাম শহরে মেস সিট, সাবলেট ও রুম খুঁজুন — থানা ও ওয়ার্ড অনুযায়ী।",
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
        <main className="mx-auto max-w-6xl px-3 pb-16 md:px-4">{children}</main>
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
