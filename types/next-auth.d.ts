import NextAuth from "next-auth";

// Extend the built-in NextAuth types to include user.id in the session
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
        };
    }
}
