/*
  Warnings:

  - The values [BLOG] on the enum `SocialPlatform` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `avgRating` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `biography` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `educationDetails` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalLikes` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `isProfilePublic` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `writer_rating` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[contentId]` on the table `profile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contentId` to the `profile` table without a default value. This is not possible if the table is not empty.
  - Made the column `slug` on table `profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "followers"."SocialPlatform_new" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TWITTER', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'TELEGRAM', 'WHATSAPP', 'WEBSITE');
ALTER TABLE "followers"."social_link" ALTER COLUMN "platform" TYPE "followers"."SocialPlatform_new" USING ("platform"::text::"followers"."SocialPlatform_new");
ALTER TYPE "followers"."SocialPlatform" RENAME TO "SocialPlatform_old";
ALTER TYPE "followers"."SocialPlatform_new" RENAME TO "SocialPlatform";
DROP TYPE "followers"."SocialPlatform_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "followers"."writer_rating" DROP CONSTRAINT "writer_rating_raterId_fkey";

-- DropForeignKey
ALTER TABLE "followers"."writer_rating" DROP CONSTRAINT "writer_rating_userId_fkey";

-- AlterTable
ALTER TABLE "followers"."profile" DROP COLUMN "avgRating",
DROP COLUMN "biography",
DROP COLUMN "birthDate",
DROP COLUMN "contact",
DROP COLUMN "educationDetails",
DROP COLUMN "location",
DROP COLUMN "totalLikes",
DROP COLUMN "website",
ADD COLUMN     "contentId" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "followers"."user" DROP COLUMN "isProfilePublic";

-- DropTable
DROP TABLE "followers"."writer_rating";

-- CreateIndex
CREATE UNIQUE INDEX "profile_contentId_key" ON "followers"."profile"("contentId");

-- AddForeignKey
ALTER TABLE "followers"."profile" ADD CONSTRAINT "profile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "followers"."content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
