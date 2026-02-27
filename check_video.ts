import { prisma } from './lib/prisma';

async function main() {
    const videos = await prisma.video.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1
    });
    console.log(JSON.stringify(videos, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
