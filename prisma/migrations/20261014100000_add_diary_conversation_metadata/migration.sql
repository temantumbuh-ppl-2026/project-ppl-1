-- Additive PB26 data changes. Existing diary rows receive safe defaults.
-- CreateEnum
CREATE TYPE "DiaryTopic" AS ENUM ('KELUARGA', 'PERTEMANAN', 'PERCINTAAN', 'IDENTITAS_RELASI', 'AKADEMIK_SEKOLAH', 'GURU_BK', 'BULLYING_KONFLIK', 'PILIHAN_STUDI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('EXPLORATION', 'CLARIFICATION', 'REFLECTION', 'ACTION', 'CLOSING');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'ATTENTION', 'HIGH');

-- CreateEnum
CREATE TYPE "SafetyCategory" AS ENUM ('SELF_HARM', 'HARM_TO_OTHERS', 'VIOLENCE_ABUSE', 'BULLYING_THREAT', 'DOMESTIC_VIOLENCE', 'GROOMING_EXPLOITATION', 'SEVERE_DISTRESS', 'OTHER');

-- CreateEnum
CREATE TYPE "SafetyAlertStatus" AS ENUM ('OPEN', 'REVIEWED', 'RESOLVED');

-- AlterTable
ALTER TABLE "diary" ADD COLUMN     "conversationState" "ConversationState" NOT NULL DEFAULT 'EXPLORATION',
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "safetyFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topics" "DiaryTopic"[] NOT NULL DEFAULT ARRAY[]::"DiaryTopic"[],
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "safety_alert" (
    "id" TEXT NOT NULL,
    "diaryId" TEXT NOT NULL,
    "triggerMessageId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "category" "SafetyCategory" NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "SafetyAlertStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "safety_alert_triggerMessageId_key" ON "safety_alert"("triggerMessageId");

-- CreateIndex
CREATE INDEX "safety_alert_diaryId_idx" ON "safety_alert"("diaryId");

-- CreateIndex
CREATE INDEX "safety_alert_status_createdAt_idx" ON "safety_alert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "safety_alert_riskLevel_status_idx" ON "safety_alert"("riskLevel", "status");

-- CreateIndex
CREATE INDEX "diary_safetyFlag_idx" ON "diary"("safetyFlag");

-- CreateIndex
CREATE INDEX "diary_riskLevel_idx" ON "diary"("riskLevel");

-- AddForeignKey
ALTER TABLE "safety_alert" ADD CONSTRAINT "safety_alert_diaryId_fkey" FOREIGN KEY ("diaryId") REFERENCES "diary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alert" ADD CONSTRAINT "safety_alert_triggerMessageId_fkey" FOREIGN KEY ("triggerMessageId") REFERENCES "diary_message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_alert" ADD CONSTRAINT "safety_alert_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

