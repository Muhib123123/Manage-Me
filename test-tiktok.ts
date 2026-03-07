import { PrismaClient } from '@prisma/client';
import "dotenv/config";
const prisma = new PrismaClient();

async function main() {
    const c = await prisma.platformConnection.findFirst({ where: { platform: 'TIKTOK' } });
    if (!c) return console.log('No token');

    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + c.accessToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });

    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

main().finally(() => prisma.$disconnect());
