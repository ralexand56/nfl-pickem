import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import SessionProvider from "./providers";

export const metadata: Metadata = {
  title: "Alexander NFL Pick’em",
  description: "Weekly NFL pick’em with Google/Facebook login",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Nav />
          <main>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
