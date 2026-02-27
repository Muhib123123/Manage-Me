import { handlers } from "@/lib/auth";

// This single route handles all NextAuth endpoints:
// GET/POST /api/auth/signin, /api/auth/callback/google, /api/auth/signout, etc.
export const { GET, POST } = handlers;
