-- CreateTable
CREATE TABLE "speaker" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "honorific" VARCHAR(50),
    "credentials" VARCHAR(100),
    "suffix" VARCHAR(50),
    "bio" TEXT,
    "avatar" VARCHAR(255),
    "avatar_md" VARCHAR(255),
    "userId" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "speaker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_speaker" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "eventId" TEXT,
    "speakerId" TEXT NOT NULL,
    "role" VARCHAR(50),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "content_speaker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "speaker_slug_key" ON "speaker"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "speaker_userId_key" ON "speaker"("userId");

-- CreateIndex
CREATE INDEX "speaker_deleted_idx" ON "speaker"("deleted");

-- CreateIndex
CREATE INDEX "content_speaker_speakerId_idx" ON "content_speaker"("speakerId");

-- CreateIndex
CREATE UNIQUE INDEX "content_speaker_articleId_speakerId_key" ON "content_speaker"("articleId", "speakerId");

-- CreateIndex
CREATE UNIQUE INDEX "content_speaker_eventId_speakerId_key" ON "content_speaker"("eventId", "speakerId");

-- AddForeignKey
ALTER TABLE "speaker" ADD CONSTRAINT "speaker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_speaker" ADD CONSTRAINT "content_speaker_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_speaker" ADD CONSTRAINT "content_speaker_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_speaker" ADD CONSTRAINT "content_speaker_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "speaker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
