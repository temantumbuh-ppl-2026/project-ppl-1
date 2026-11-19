import {
  RiskLevel,
  type Prisma,
  type SafetyCategory,
} from "@/app/generated/prisma/client";
import { encrypt } from "@/lib/encryption";
import {
  DiaryStructuredOutputError,
  type DiaryStructuredOutput,
} from "@/lib/diary/structured-output";

export type PreparedHighRiskAlert = {
  category: SafetyCategory;
  encryptedSummary: string;
};

export function prepareHighRiskAlert(
  safety: DiaryStructuredOutput["safety"],
): PreparedHighRiskAlert | null {
  if (safety.riskLevel !== RiskLevel.HIGH) return null;
  if (!safety.flag || !safety.category || !safety.summary?.trim()) {
    throw new DiaryStructuredOutputError();
  }
  return {
    category: safety.category,
    encryptedSummary: encrypt(safety.summary),
  };
}

// The caller's transaction also owns the trigger message and diary update.
export async function persistHighRiskAlert(
  tx: Prisma.TransactionClient,
  diaryId: string,
  triggerMessageId: string,
  alert: PreparedHighRiskAlert | null,
): Promise<void> {
  if (!alert) return;
  await tx.safetyAlert.upsert({
    where: { triggerMessageId },
    create: {
      diaryId,
      triggerMessageId,
      riskLevel: RiskLevel.HIGH,
      category: alert.category,
      summary: alert.encryptedSummary,
    },
    update: {},
    select: { id: true },
  });
}
