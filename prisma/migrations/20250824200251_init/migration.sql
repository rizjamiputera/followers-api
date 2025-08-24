-- CreateEnum
CREATE TYPE "followers"."Role" AS ENUM ('SUPERADMIN', 'ADMIN', 'OPERATOR', 'USER');

-- CreateEnum
CREATE TYPE "followers"."Permission" AS ENUM ('READ', 'CREATE', 'EDIT', 'DELETE', 'APPROVE');

-- CreateEnum
CREATE TYPE "followers"."Module" AS ENUM ('ARTICLE', 'EVENT', 'USER', 'COMMENT');

-- CreateEnum
CREATE TYPE "followers"."ContentStatus" AS ENUM ('DRAFT', 'ON_REVIEW', 'REJECTED', 'PUBLISHED', 'TAKE_DOWN');

-- CreateEnum
CREATE TYPE "followers"."ApprovalStatus" AS ENUM ('REJECTED', 'PUBLISHED', 'TAKE_DOWN');

-- CreateEnum
CREATE TYPE "followers"."ReactionType" AS ENUM ('like', 'dislike', 'love', 'clap');

-- CreateEnum
CREATE TYPE "followers"."VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "followers"."SocialPlatform" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TWITTER', 'YOUTUBE', 'TIKTOK', 'LINKEDIN', 'TELEGRAM', 'WHATSAPP', 'WEBSITE', 'BLOG');

-- CreateTable
CREATE TABLE "followers"."user" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "avatar" VARCHAR(255),
    "avatar_md" VARCHAR(255),
    "role" "followers"."Role" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."password" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."user_permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" "followers"."Module" NOT NULL,
    "permission" "followers"."Permission" NOT NULL,

    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."auth" (
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
CREATE TABLE "followers"."error-log" (
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
CREATE TABLE "followers"."article" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "image_md" VARCHAR(255) NOT NULL,
    "contentId" TEXT NOT NULL,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "followers"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."event" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500) NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "image_md" VARCHAR(255) NOT NULL,
    "contentId" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "status" "followers"."ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."content_stats" (
    "id" TEXT NOT NULL,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "dislikeCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" TIMESTAMP(3),
    "articleId" TEXT,
    "eventId" TEXT,

    CONSTRAINT "content_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."content" (
    "id" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."content_version" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500),
    "content" JSONB NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "image_sm" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "articleId" TEXT,
    "eventId" TEXT,

    CONSTRAINT "content_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."photo_content" (
    "id" TEXT NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "articleId" TEXT,
    "eventId" TEXT,
    "main_photo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photo_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."content_approval" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "eventId" TEXT,
    "approverId" TEXT NOT NULL,
    "status" "followers"."ApprovalStatus" NOT NULL DEFAULT 'REJECTED',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."tag" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."content_tag" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "eventId" TEXT,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "content_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."article_reaction" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "eventId" TEXT,
    "userId" TEXT NOT NULL,
    "type" "followers"."ReactionType" NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "parentId" TEXT,
    "mentionedId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."comment_reaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "followers"."ReactionType" NOT NULL DEFAULT 'like',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."visit" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "eventId" TEXT,
    "path" VARCHAR(500) NOT NULL,
    "visitorId" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(500),
    "referrer" VARCHAR(500),
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."visitor" (
    "id" TEXT NOT NULL,
    "fingerprint" VARCHAR(255),
    "firstVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVisitAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."article_bookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "article_bookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" VARCHAR(100),
    "birthDate" TIMESTAMP(3),
    "biography" TEXT,
    "specializations" TEXT[],
    "educationDetails" TEXT,
    "totalArticles" INTEGER NOT NULL DEFAULT 0,
    "totalFollowers" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION,
    "slug" VARCHAR(100),
    "website" VARCHAR(255),
    "contact" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."social_link" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "platform" "followers"."SocialPlatform" NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "handle" VARCHAR(100),

    CONSTRAINT "social_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."writer_rating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "writer_rating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "followers"."user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "followers"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_userId_key" ON "followers"."password"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_userId_module_permission_key" ON "followers"."user_permission"("userId", "module", "permission");

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "followers"."article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "article_contentId_key" ON "followers"."article"("contentId");

-- CreateIndex
CREATE INDEX "article_status_publishedAt_idx" ON "followers"."article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "article_authorId_status_idx" ON "followers"."article"("authorId", "status");

-- CreateIndex
CREATE INDEX "article_deleted_status_publishedAt_idx" ON "followers"."article"("deleted", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "followers"."event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "event_contentId_key" ON "followers"."event"("contentId");

-- CreateIndex
CREATE INDEX "event_status_publishedAt_idx" ON "followers"."event"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "event_authorId_status_idx" ON "followers"."event"("authorId", "status");

-- CreateIndex
CREATE INDEX "event_deleted_status_publishedAt_idx" ON "followers"."event"("deleted", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_stats_articleId_key" ON "followers"."content_stats"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "content_stats_eventId_key" ON "followers"."content_stats"("eventId");

-- CreateIndex
CREATE INDEX "content_version_articleId_idx" ON "followers"."content_version"("articleId");

-- CreateIndex
CREATE INDEX "content_version_eventId_idx" ON "followers"."content_version"("eventId");

-- CreateIndex
CREATE INDEX "content_approval_articleId_idx" ON "followers"."content_approval"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "followers"."tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "followers"."tag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_tag_articleId_tagId_key" ON "followers"."content_tag"("articleId", "tagId");

-- CreateIndex
CREATE INDEX "article_reaction_articleId_type_idx" ON "followers"."article_reaction"("articleId", "type");

-- CreateIndex
CREATE INDEX "article_reaction_eventId_type_idx" ON "followers"."article_reaction"("eventId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "article_reaction_articleId_userId_key" ON "followers"."article_reaction"("articleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "article_reaction_eventId_userId_key" ON "followers"."article_reaction"("eventId", "userId");

-- CreateIndex
CREATE INDEX "comment_contentId_idx" ON "followers"."comment"("contentId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_reaction_commentId_userId_key" ON "followers"."comment_reaction"("commentId", "userId");

-- CreateIndex
CREATE INDEX "visit_articleId_visitedAt_idx" ON "followers"."visit"("articleId", "visitedAt");

-- CreateIndex
CREATE INDEX "visit_eventId_visitedAt_idx" ON "followers"."visit"("eventId", "visitedAt");

-- CreateIndex
CREATE INDEX "visit_path_visitedAt_idx" ON "followers"."visit"("path", "visitedAt");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_fingerprint_key" ON "followers"."visitor"("fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "article_bookmark_userId_articleId_key" ON "followers"."article_bookmark"("userId", "articleId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_userId_key" ON "followers"."profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profile_slug_key" ON "followers"."profile"("slug");

-- CreateIndex
CREATE INDEX "profile_slug_idx" ON "followers"."profile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "social_link_profileId_platform_key" ON "followers"."social_link"("profileId", "platform");

-- CreateIndex
CREATE INDEX "follow_followerId_idx" ON "followers"."follow"("followerId");

-- CreateIndex
CREATE INDEX "follow_followingId_idx" ON "followers"."follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follow_followerId_followingId_key" ON "followers"."follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "writer_rating_userId_rating_idx" ON "followers"."writer_rating"("userId", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "writer_rating_userId_raterId_key" ON "followers"."writer_rating"("userId", "raterId");

-- AddForeignKey
ALTER TABLE "followers"."password" ADD CONSTRAINT "password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."user_permission" ADD CONSTRAINT "user_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."auth" ADD CONSTRAINT "auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."error-log" ADD CONSTRAINT "error-log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article" ADD CONSTRAINT "article_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "followers"."content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article" ADD CONSTRAINT "article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."event" ADD CONSTRAINT "event_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "followers"."content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."event" ADD CONSTRAINT "event_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_stats" ADD CONSTRAINT "content_stats_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_stats" ADD CONSTRAINT "content_stats_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_version" ADD CONSTRAINT "content_version_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_version" ADD CONSTRAINT "content_version_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."photo_content" ADD CONSTRAINT "photo_content_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."photo_content" ADD CONSTRAINT "photo_content_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_approval" ADD CONSTRAINT "content_approval_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_approval" ADD CONSTRAINT "content_approval_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_approval" ADD CONSTRAINT "content_approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_tag" ADD CONSTRAINT "content_tag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_tag" ADD CONSTRAINT "content_tag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."content_tag" ADD CONSTRAINT "content_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "followers"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article_reaction" ADD CONSTRAINT "article_reaction_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article_reaction" ADD CONSTRAINT "article_reaction_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article_reaction" ADD CONSTRAINT "article_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."comment" ADD CONSTRAINT "comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."comment" ADD CONSTRAINT "comment_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "followers"."content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."comment" ADD CONSTRAINT "comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "followers"."comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."comment" ADD CONSTRAINT "comment_mentionedId_fkey" FOREIGN KEY ("mentionedId") REFERENCES "followers"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."comment_reaction" ADD CONSTRAINT "comment_reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "followers"."comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."comment_reaction" ADD CONSTRAINT "comment_reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."visit" ADD CONSTRAINT "visit_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."visit" ADD CONSTRAINT "visit_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."visit" ADD CONSTRAINT "visit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "followers"."visitor"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."visitor" ADD CONSTRAINT "visitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article_bookmark" ADD CONSTRAINT "article_bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."article_bookmark" ADD CONSTRAINT "article_bookmark_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "followers"."article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."profile" ADD CONSTRAINT "profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."social_link" ADD CONSTRAINT "social_link_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "followers"."profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."follow" ADD CONSTRAINT "follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."follow" ADD CONSTRAINT "follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."writer_rating" ADD CONSTRAINT "writer_rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."writer_rating" ADD CONSTRAINT "writer_rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
