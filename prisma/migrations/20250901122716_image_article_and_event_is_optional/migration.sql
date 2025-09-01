-- AlterTable
ALTER TABLE "followers"."article" ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "image_md" DROP NOT NULL;

-- AlterTable
ALTER TABLE "followers"."content_version" ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "image_sm" DROP NOT NULL;

-- AlterTable
ALTER TABLE "followers"."event" ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "image_md" DROP NOT NULL;
