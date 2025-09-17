import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const authOptions = {
  adapter: DrizzleAdapter(db, { schema }),
  providers: [Google, Facebook],
  session: { strategy: "jwt" as const },
  callbacks: {
    async session({ session, token }: any) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
