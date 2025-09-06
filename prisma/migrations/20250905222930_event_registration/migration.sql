-- CreateEnum
CREATE TYPE "followers"."RegistrationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "followers"."FormFieldType" AS ENUM ('TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'RADIO', 'DATE');

-- AlterTable
ALTER TABLE "followers"."event" ADD COLUMN     "image_portrait" VARCHAR(255),
ADD COLUMN     "image_portrait_md" VARCHAR(255);

-- CreateTable
CREATE TABLE "followers"."event_registration_config" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT NOT NULL DEFAULT 'Registrasi',
    "participantLimit" INTEGER,
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "formFields" JSONB NOT NULL,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "confirmationMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers"."event_registration" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "status" "followers"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_config_eventId_key" ON "followers"."event_registration_config"("eventId");

-- CreateIndex
CREATE INDEX "event_registration_eventId_status_idx" ON "followers"."event_registration"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_registration_userId_status_idx" ON "followers"."event_registration"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_eventId_userId_key" ON "followers"."event_registration"("eventId", "userId");

-- AddForeignKey
ALTER TABLE "followers"."event_registration_config" ADD CONSTRAINT "event_registration_config_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."event_registration" ADD CONSTRAINT "event_registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "followers"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers"."event_registration" ADD CONSTRAINT "event_registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "followers"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
