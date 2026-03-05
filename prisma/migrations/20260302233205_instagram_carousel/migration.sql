/*
  Warnings:

  - You are about to drop the column `storageUrl` on the `InstagramPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "InstagramPost" DROP COLUMN "storageUrl",
ADD COLUMN     "mediaUrls" TEXT[];
