-- CreateTable
CREATE TABLE "TiktokPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caption" TEXT,
    "privacyLevel" TEXT NOT NULL DEFAULT 'PUBLIC_TO_EVERYONE',
    "allowDuet" BOOLEAN NOT NULL DEFAULT true,
    "allowStitch" BOOLEAN NOT NULL DEFAULT true,
    "allowComment" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "tiktokId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TiktokPost_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TiktokPost" ADD CONSTRAINT "TiktokPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
