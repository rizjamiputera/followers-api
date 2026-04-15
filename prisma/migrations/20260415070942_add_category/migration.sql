-- AlterTable
ALTER TABLE "article" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "showOnHome" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_name_key" ON "category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE INDEX "category_sortOrder_idx" ON "category"("sortOrder");

-- CreateIndex
CREATE INDEX "category_showOnHome_sortOrder_idx" ON "category"("showOnHome", "sortOrder");

-- CreateIndex
CREATE INDEX "article_categoryId_status_publishedAt_idx" ON "article"("categoryId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "event_categoryId_status_publishedAt_idx" ON "event"("categoryId", "status", "publishedAt");

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
