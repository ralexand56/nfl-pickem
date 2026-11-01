import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import SessionProvider from "./providers";
import { getUserGroups, getViewerId } from "@/lib/group";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Pick’em Club · NFL Pick’em for Families & Friends",
  description:
    "Run a private NFL pick’em for your family or group: weekly picks, automatic scoring, leaderboard, buy-in tracking and Super Bowl squares. $10 a season.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewerId = await getViewerId();
  const groups = viewerId ? await getUserGroups(viewerId) : [];

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans min-h-screen">
        <SessionProvider>
          <Nav groups={groups} />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
