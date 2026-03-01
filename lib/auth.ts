import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    // Phase 1: Basic Auth. Only request profile info.
                    // We will explicitly request YouTube permissions later in the Connections Hub.
                    scope: "openid email profile",
                },
            },
        }),
    ],
    callbacks: {
        // Attach user ID to the session object
        async session({ session, user }) {
            session.user.id = user.id;
            return session;
        },
    },
    pages: {
        signIn: "/login", // Our custom login page
    },
});
