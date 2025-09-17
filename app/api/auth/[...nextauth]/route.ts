import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/db/auth-schema";
// import * as schema from "@/db/schema";
console.log(process.env.GOOGLE_CLIENT_ID);
console.log(process.env.GOOGLE_CLIENT_SECRET);
console.log(process.env.FACEBOOK_CLIENT_ID);
console.log(process.env.FACEBOOK_CLIENT_SECRET);

export const authOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions, // optional if using JWT sessions
    verificationTokensTable: verificationTokens, // optional unless using magic links
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: {
        user?: { id?: string } & Record<string, unknown>;
        expires?: string;
      };
      token: { sub?: string };
    }) {
      if (session.user && token.sub) session.user.id = token.sub;
      // Ensure the returned object matches the Session type (must include expires)
      const newSession = {
        ...session,
        user: session.user,
        expires: session.expires,
      };
      console.log("SESSION CALLBACK", { session, token, newSession });
      return { ...newSession };
    },
  },
};

import type { AuthOptions } from "next-auth";

const handler = NextAuth(authOptions as AuthOptions);
export { handler as GET, handler as POST };
