-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'GROWTH', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "OrgStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ProtocolSource" AS ENUM ('TEMPLATE', 'AI_IMPORTED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ScheduledStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESPONDED', 'BOOKED', 'ESCALATED_MD', 'RESOLVED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'STARTER',
    "status" "OrgStatus" NOT NULL DEFAULT 'TRIAL',
    "stripeCustomerId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicProfile" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "logoUrl" TEXT,
    "brandColor" TEXT NOT NULL DEFAULT '#e85d2c',
    "senderName" TEXT,
    "twilioNumber" TEXT,
    "replyToPhone" TEXT,
    "bookingUrl" TEXT,
    "reviewLink" TEXT,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "consentText" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "segment" TEXT,
    "source" "ProtocolSource" NOT NULL DEFAULT 'TEMPLATE',
    "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "tone" TEXT NOT NULL DEFAULT 'friendly-medspa',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolStep" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "offsetMinutes" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "includeEscalation" BOOLEAN NOT NULL DEFAULT false,
    "includeReviewAsk" BOOLEAN NOT NULL DEFAULT false,
    "includeRebook" BOOLEAN NOT NULL DEFAULT false,
    "mediaUrl" TEXT,

    CONSTRAINT "ProtocolStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceMapping" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalServiceId" TEXT NOT NULL,
    "externalLabel" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "autoEnroll" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "consentAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "procedureLabel" TEXT,
    "appointmentAt" TIMESTAMP(3) NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentOffsetMin" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledMessage" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "protocolStepId" TEXT NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduledStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "twilioSid" TEXT,
    "sentAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "ScheduledMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "body" TEXT NOT NULL,
    "fromNumber" TEXT,
    "toNumber" TEXT,
    "twilioSid" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,

    CONSTRAINT "MessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "lastInboundAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "patientId" TEXT,
    "orgId" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'concern',
    "message" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewRequest" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'google',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalMerchantId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'connected',
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_stripeCustomerId_key" ON "Organization"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicProfile_orgId_key" ON "ClinicProfile"("orgId");

-- CreateIndex
CREATE INDEX "Protocol_orgId_idx" ON "Protocol"("orgId");

-- CreateIndex
CREATE INDEX "ProtocolStep_protocolId_idx" ON "ProtocolStep"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMapping_orgId_provider_externalServiceId_key" ON "ServiceMapping"("orgId", "provider", "externalServiceId");

-- CreateIndex
CREATE INDEX "Patient_orgId_idx" ON "Patient"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_orgId_phone_key" ON "Patient"("orgId", "phone");

-- CreateIndex
CREATE INDEX "Enrollment_patientId_idx" ON "Enrollment"("patientId");

-- CreateIndex
CREATE INDEX "Enrollment_orgId_idx" ON "Enrollment"("orgId");

-- CreateIndex
CREATE INDEX "ScheduledMessage_sendAt_status_idx" ON "ScheduledMessage"("sendAt", "status");

-- CreateIndex
CREATE INDEX "ScheduledMessage_enrollmentId_idx" ON "ScheduledMessage"("enrollmentId");

-- CreateIndex
CREATE INDEX "MessageLog_enrollmentId_idx" ON "MessageLog"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_orgId_patientId_key" ON "Conversation"("orgId", "patientId");

-- CreateIndex
CREATE INDEX "Alert_orgId_status_idx" ON "Alert"("orgId", "status");

-- CreateIndex
CREATE INDEX "ReviewRequest_orgId_idx" ON "ReviewRequest"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_orgId_provider_key" ON "Integration"("orgId", "provider");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicProfile" ADD CONSTRAINT "ClinicProfile_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Protocol" ADD CONSTRAINT "Protocol_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolStep" ADD CONSTRAINT "ProtocolStep_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMapping" ADD CONSTRAINT "ServiceMapping_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceMapping" ADD CONSTRAINT "ServiceMapping_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledMessage" ADD CONSTRAINT "ScheduledMessage_protocolStepId_fkey" FOREIGN KEY ("protocolStepId") REFERENCES "ProtocolStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLog" ADD CONSTRAINT "MessageLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewRequest" ADD CONSTRAINT "ReviewRequest_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ════════════════════════════════════════════════════
-- Row Level Security (defense in depth)
-- The app talks to Supabase server-side with the SECRET key, which bypasses
-- RLS. We enable RLS with NO policies so the public/publishable (anon) key
-- can read/write nothing by default. Add per-row policies later for any
-- client-side access.
-- ════════════════════════════════════════════════════
ALTER TABLE "Organization"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClinicProfile"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Protocol"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProtocolStep"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceMapping"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Enrollment"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MessageLog"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReviewRequest"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration"      ENABLE ROW LEVEL SECURITY;
