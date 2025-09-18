// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { accounts, sessions, verificationTokens } from "@/db/auth-schema";

export const authOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions, // optional if using JWT sessions
    verificationTokensTable: verificationTokens, // optional unless using magic links
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Facebook({
    //   clientId: process.env.FACEBOOK_CLIENT_ID!,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    // }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: import("next-auth").Session;
      token: import("next-auth/jwt").JWT;
    }) {
      if (session.user && token.sub) session.user.id = token.sub; // UUID string
      return session;
    },
  },
};

import type { NextAuthOptions } from "next-auth";

const handler = NextAuth(authOptions as NextAuthOptions);
export { handler as GET, handler as POST };
