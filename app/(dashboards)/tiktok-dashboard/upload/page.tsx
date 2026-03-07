import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import TikTokUploadFormClient from "./UploadFormClient";

export default async function TikTokUploadPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const ttConnection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId: session.user.id, platform: "TIKTOK" },
        },
    });

    if (!ttConnection) {
        return (
            <div className="p-6 max-w-2xl mx-auto mt-10">
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2">
                        {/* TikTok logo mark */}
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" rx="12" fill="#010101" />
                            <path
                                d="M32.5 10h-5.3v19.3a5.2 5.2 0 01-5.2 5.1 5.2 5.2 0 01-5.2-5.1 5.2 5.2 0 015.2-5.1c.5 0 1 .1 1.4.2V19a10.5 10.5 0 00-1.4-.1A10.5 10.5 0 0012 29.3 10.5 10.5 0 0022.5 39.8 10.5 10.5 0 0033 29.3V19.8a17.2 17.2 0 0010 3.2v-5.3a11.8 11.8 0 01-10.5-7.7z"
                                fill="white"
                            />
                            <path
                                d="M35.5 19.7a11.8 11.8 0 01-6.8-3.8v13.4A10.5 10.5 0 0118.2 39.8"
                                stroke="#69C9D0"
                                strokeWidth="1.5"
                                fill="none"
                            />
                            <path
                                d="M14.8 24.2a10.5 10.5 0 000 10.2"
                                stroke="#EE1D52"
                                strokeWidth="1.5"
                                fill="none"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold">TikTok Not Connected</h1>
                    <p className="text-[var(--muted)] text-sm max-w-md">
                        You need to connect your TikTok account before you can schedule and publish videos.
                    </p>
                    <Link
                        href="/connect"
                        className="mt-4 px-6 py-3 font-semibold rounded-xl text-white transition-opacity hover:opacity-85"
                        style={{ background: "linear-gradient(135deg, #69C9D0 0%, #EE1D52 100%)" }}
                    >
                        Go to Connections
                    </Link>
                </div>
            </div>
        );
    }

    return <TikTokUploadFormClient accountName={ttConnection.platformName || "your account"} />;
}
