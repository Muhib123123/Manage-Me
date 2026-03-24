import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_PROMOS = ["MIKK", "STA", "MMFA"];

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { code } = body;

        if (!code || typeof code !== "string") {
            return NextResponse.json({ error: "Invalid promo code format" }, { status: 400 });
        }

        const upperCode = code.trim().toUpperCase();

        if (!ALLOWED_PROMOS.includes(upperCode)) {
            return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
        }

        // Apply Creator plan
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                plan: "CREATOR",
                planActivatedAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, message: "Plan upgraded to Creator successfully!" });

    } catch (error) {
        console.error("Promo code error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
