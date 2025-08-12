-- CreateEnum
CREATE TYPE "followers_dev"."UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'OPERATOR', 'USER');

-- CreateEnum
CREATE TYPE "followers_dev"."Permission" AS ENUM ('READ', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'PUBLISH');

-- CreateEnum
CREATE TYPE "followers_dev"."Module" AS ENUM ('ARTICLE', 'USER', 'COMMENT');

-- CreateEnum
CREATE TYPE "followers_dev"."ArticleStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "followers_dev"."ApprovalStatus" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "followers_dev"."ReactionType" AS ENUM ('like', 'dislike', 'love', 'clap');

-- CreateTable
CREATE TABLE "followers_dev"."user" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "avatar" VARCHAR(255),
    "avatar_md" VARCHAR(255),
    "role" "followers_dev"."UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."password" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."user_permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "followers_dev"."Module" NOT NULL,
    "permission" "followers_dev"."Permission" NOT NULL,

    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."auth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "access_token" VARCHAR(300) NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" VARCHAR(100) NOT NULL,
    "method" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."error-log" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "path" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "userId" TEXT,
    "requestData" JSONB,
    "headers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error-log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "contentId" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "followers_dev"."ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "readStatId" TEXT NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article_content" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500),
    "content" JSONB NOT NULL,
    "featuredImage" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article_content_version" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500),
    "content" JSONB NOT NULL,
    "featuredImage" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "article_content_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article_approval" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "followers_dev"."ApprovalStatus" NOT NULL DEFAULT 'REJECTED',
    "note" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."tag" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article_tag" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "article_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article_reaction" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."comment" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."article_read_stat" (
    "id" TEXT NOT NULL,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "article_read_stat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."visit" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "visitorId" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "referrer" VARCHAR(500),
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers_dev"."visitor" (
    "id" TEXT NOT NULL,
    "fingerprint" VARCHAR(255),
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "visitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "followers_dev"."user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "followers_dev"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_userId_key" ON "followers_dev"."password"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_userId_module_permission_key" ON "followers_dev"."user_permission"("userId", "module", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "followers_dev"."article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_contentId_key" ON "followers_dev"."article"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "article_readStatId_key" ON "followers_dev"."article"("readStatId");

-- CreateIndex
CREATE INDEX "article_status_publishedAt_idx" ON "followers_dev"."article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "article_content_version_articleId_idx" ON "followers_dev"."article_content_version"("articleId");

-- CreateIndex
CREATE INDEX "article_approval_articleId_sequence_idx" ON "followers_dev"."article_approval"("articleId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "followers_dev"."tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "followers_dev"."tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_tag_articleId_tagId_key" ON "followers_dev"."article_tag"("articleId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "article_reaction_articleId_userId_key" ON "followers_dev"."article_reaction"("articleId", "userId");

-- CreateIndex
CREATE INDEX "comment_articleId_idx" ON "followers_dev"."comment"("articleId");

-- CreateIndex
CREATE INDEX "visit_articleId_visitedAt_idx" ON "followers_dev"."visit"("articleId", "visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_fingerprint_key" ON "followers_dev"."visitor"("fingerprint");

-- AddForeignKey
ALTER TABLE "followers_dev"."password" ADD CONSTRAINT "password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."user_permission" ADD CONSTRAINT "user_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."auth" ADD CONSTRAINT "auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."error-log" ADD CONSTRAINT "error-log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article" ADD CONSTRAINT "article_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "followers_dev"."article_content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article" ADD CONSTRAINT "article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article" ADD CONSTRAINT "article_readStatId_fkey" FOREIGN KEY ("readStatId") REFERENCES "followers_dev"."article_read_stat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_content_version" ADD CONSTRAINT "article_content_version_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers_dev"."article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_approval" ADD CONSTRAINT "article_approval_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers_dev"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_approval" ADD CONSTRAINT "article_approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_tag" ADD CONSTRAINT "article_tag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers_dev"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_tag" ADD CONSTRAINT "article_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "followers_dev"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_reaction" ADD CONSTRAINT "article_reaction_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers_dev"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."article_reaction" ADD CONSTRAINT "article_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."comment" ADD CONSTRAINT "comment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers_dev"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."comment" ADD CONSTRAINT "comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."comment" ADD CONSTRAINT "comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "followers_dev"."comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."visit" ADD CONSTRAINT "visit_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers_dev"."article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."visit" ADD CONSTRAINT "visit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "followers_dev"."visitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."visitor" ADD CONSTRAINT "visitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
