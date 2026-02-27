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
                    // Request YouTube upload permission at login
                    scope: [
                        "openid",
                        "email",
                        "profile",
                        "https://www.googleapis.com/auth/youtube.upload",
                        "https://www.googleapis.com/auth/youtube.readonly",
                    ].join(" "),
                    // CRITICAL: needed to receive a refresh_token for background uploads
                    access_type: "offline",
                    // CRITICAL: forces consent screen every time so refresh_token is always returned
                    prompt: "consent",
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
