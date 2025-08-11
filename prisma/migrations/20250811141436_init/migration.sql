-- CreateEnum
CREATE TYPE "followers_dev"."UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'OPERATOR', 'USER');

-- CreateEnum
CREATE TYPE "followers_dev"."Permission" AS ENUM ('READ', 'CREATE', 'EDIT', 'DELETE');

-- CreateEnum
CREATE TYPE "followers_dev"."Module" AS ENUM ('ARTICLE', 'USER');

-- CreateTable
CREATE TABLE "followers_dev"."user" (
    "id" TEXT NOT NULL,
    "role" "followers_dev"."UserRole" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "avatar" VARCHAR(255),
    "avatar_md" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
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

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "followers_dev"."user"("email");

-- CreateIndex
CREATE INDEX "user_email_idx" ON "followers_dev"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_userId_key" ON "followers_dev"."password"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_userId_module_permission_key" ON "followers_dev"."user_permission"("userId", "module", "permission");

-- AddForeignKey
ALTER TABLE "followers_dev"."password" ADD CONSTRAINT "password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."user_permission" ADD CONSTRAINT "user_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."auth" ADD CONSTRAINT "auth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers_dev"."error-log" ADD CONSTRAINT "error-log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers_dev"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
