import { z } from "zod";

import {
  ConversationState,
  DiaryTopic,
  RiskLevel,
  SafetyCategory,
} from "@/app/generated/prisma/client";

const safetySchema = z
  .strictObject({
    flag: z.boolean(),
    riskLevel: z.enum(RiskLevel),
    category: z.enum(SafetyCategory).nullable(),
    summary: z.string().trim().min(1).max(500).nullable(),
  })
  .superRefine((safety, context) => {
    const hasRisk = safety.riskLevel !== RiskLevel.NONE;
    if (
      safety.flag !== hasRisk ||
      (hasRisk && (!safety.category || !safety.summary)) ||
      (!hasRisk && (safety.category !== null || safety.summary !== null))
    ) {
      context.addIssue({
        code: "custom",
        message: "Metadata keselamatan tidak konsisten.",
      });
    }
  });

export const diaryStructuredOutputSchema = z
  .strictObject({
    reply: z.string().trim().min(1).max(4000),
    topics: z.array(z.enum(DiaryTopic)).max(9),
    conversationState: z.enum(ConversationState),
    proactiveSuggestion: z.string().trim().min(1).max(500).nullable(),
    safety: safetySchema,
  })
  .superRefine((output, context) => {
    if (new Set(output.topics).size !== output.topics.length) {
      context.addIssue({
        code: "custom",
        path: ["topics"],
        message: "Topik tidak boleh berulang.",
      });
    }

    if (
      output.topics.length > 1 &&
      output.topics.includes(DiaryTopic.LAINNYA)
    ) {
      context.addIssue({
        code: "custom",
        path: ["topics"],
        message: "LAINNYA hanya boleh dipakai tanpa topik khusus.",
      });
    }
  });

export type DiaryStructuredOutput = z.infer<typeof diaryStructuredOutputSchema>;

export class DiaryStructuredOutputError extends Error {
  constructor() {
    super("AI menghasilkan format balasan yang tidak valid.");
    this.name = "DiaryStructuredOutputError";
  }
}

export function parseDiaryStructuredOutput(raw: string): DiaryStructuredOutput {
  let payload: unknown;

  try {
    payload = JSON.parse(raw);
  } catch {
    throw new DiaryStructuredOutputError();
  }

  const result = diaryStructuredOutputSchema.safeParse(payload);
  if (!result.success) {
    throw new DiaryStructuredOutputError();
  }

  return result.data;
}
