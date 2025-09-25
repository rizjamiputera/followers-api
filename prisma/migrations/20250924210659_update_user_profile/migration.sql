/*
  Warnings:

  - The values [BLOG] on the enum `SocialPlatform` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `avgRating` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `biography` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `educationDetails` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `totalLikes` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `profile` table. All the data in the column will be lost.
  - You are about to drop the column `isProfilePublic` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `writer_rating` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[contentId]` on the table `profile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contentId` to the `profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `user` table without a default value. This is not possible if the table is not empty.

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

-- DropIndex
DROP INDEX "followers"."profile_slug_idx";

-- DropIndex
DROP INDEX "followers"."profile_slug_key";

-- DropIndex
DROP INDEX "followers"."user_email_idx";

-- AlterTable
ALTER TABLE "followers"."profile" DROP COLUMN "avgRating",
DROP COLUMN "biography",
DROP COLUMN "birthDate",
DROP COLUMN "contact",
DROP COLUMN "educationDetails",
DROP COLUMN "location",
DROP COLUMN "slug",
DROP COLUMN "totalLikes",
DROP COLUMN "website",
ADD COLUMN     "contentId" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "followers"."user" DROP COLUMN "isProfilePublic",
ADD COLUMN     "username" VARCHAR(100);
-- Generate unique usernames from names for existing users
WITH username_counts AS (
    SELECT
        id,
        name,
        LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '_', 'g')) as base_username,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '_', 'g'))
            ORDER BY id
        ) as row_num
    FROM "followers"."user"
    WHERE username IS NULL
    )
    UPDATE "followers"."user"
    SET username = CASE
        WHEN uc.row_num = 1 THEN uc.base_username
        ELSE uc.base_username || '_' || uc.row_num::text
    END
    FROM username_counts uc
    WHERE "followers"."user".id = uc.id;

-- Make username NOT NULL after populating data
ALTER TABLE "followers"."user" ALTER COLUMN "username" SET NOT NULL;


-- DropTable
DROP TABLE "followers"."writer_rating";

-- CreateIndex
CREATE UNIQUE INDEX "profile_contentId_key" ON "followers"."profile"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "followers"."user"("username");

-- CreateIndex
CREATE INDEX "user_email_username_idx" ON "followers"."user"("email", "username");

-- AddForeignKey
ALTER TABLE "followers"."profile" ADD CONSTRAINT "profile_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "followers"."content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
