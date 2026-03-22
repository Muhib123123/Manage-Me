import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connections = await prisma.platformConnection.findMany({
    where: { platform: "INSTAGRAM" },
    select: { userId: true, platformName: true, accessToken: true, expiresAt: true, updatedAt: true }
});

for (const c of connections) {
    const tok = c.accessToken || "";
    console.log("=== Instagram Connection ===");
    console.log("User    :", c.userId);
    console.log("Name    :", c.platformName);
    console.log("Updated :", c.updatedAt);
    console.log("Expires :", c.expiresAt);
    console.log("Tok len :", tok.length);
    console.log("Prefix  :", tok.slice(0, 30));
    console.log("Prefix  :", tok.slice(30, 60));
    console.log("Has spaces:", tok.includes(" "));
    console.log("Starts IG:", tok.startsWith("IG"));
    console.log("Starts EAA:", tok.startsWith("EAA")); // FB token
}

await prisma.$disconnect();
