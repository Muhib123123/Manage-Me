import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const [connections, user] = await Promise.all([
        prisma.platformConnection.findMany({
            where: { userId: session.user.id }
        }),
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: { plan: true }
        })
    ]);

    const connectedPlatforms = connections.map(c => c.platform);
    const plan = user?.plan ?? "FREE";

    return (
        <DashboardShell user={session.user} connections={connectedPlatforms} plan={plan}>
            {children}
        </DashboardShell>
    );
}
