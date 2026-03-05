import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import InstagramUploadFormClient from "./UploadFormClient";

export default async function InstagramUploadPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const igConnection = await prisma.platformConnection.findUnique({
        where: {
            userId_platform: { userId: session.user.id, platform: "INSTAGRAM" },
        },
    });

    if (!igConnection) {
        return (
            <div className="p-6 max-w-2xl mx-auto mt-10">
                <div className="bg-[var(--surface)] border border-[var(--border-solid)] rounded-2xl p-8 shadow-[var(--shadow-sm)] flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                                <radialGradient id="ig-noconn" cx="30%" cy="107%" r="150%">
                                    <stop offset="0%" stopColor="#fdf497" />
                                    <stop offset="5%" stopColor="#fdf497" />
                                    <stop offset="45%" stopColor="#fd5949" />
                                    <stop offset="60%" stopColor="#d6249f" />
                                    <stop offset="90%" stopColor="#285AEB" />
                                </radialGradient>
                            </defs>
                            <rect width="24" height="24" rx="6" fill="url(#ig-noconn)" />
                            <rect x="6.5" y="6.5" width="11" height="11" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
                            <circle cx="12" cy="12" r="2.8" stroke="white" strokeWidth="1.5" fill="none" />
                            <circle cx="16.2" cy="7.8" r="0.8" fill="white" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold">Instagram Not Connected</h1>
                    <p className="text-[var(--muted)] text-sm max-w-md">
                        You need to connect your Instagram account before you can schedule and publish posts.
                    </p>
                    <style>{`.ig-connect-btn{background:linear-gradient(45deg,#fdf497,#fd5949,#d6249f,#285AEB);transition:opacity .2s}.ig-connect-btn:hover{opacity:.82}`}</style>
                    <Link
                        href="/connect"
                        className="ig-connect-btn mt-4 px-6 py-3 font-semibold rounded-xl text-white"
                    >
                        Go to Connections
                    </Link>
                </div>
            </div>
        );
    }

    return <InstagramUploadFormClient accountName={igConnection.platformName || "your account"} />;
}
