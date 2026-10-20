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

const VALID_TOPIC_SET = new Set<string>(Object.values(DiaryTopic));
const VALID_STATE_SET = new Set<string>(Object.values(ConversationState));
const VALID_RISK_SET = new Set<string>(Object.values(RiskLevel));
const VALID_CATEGORY_SET = new Set<string>(Object.values(SafetyCategory));

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }
  return cleaned;
}

function extractJsonObjectString(raw: string): string {
  const cleaned = cleanJsonString(raw);
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export function sanitizeAiOutputPayload(rawPayload: unknown): unknown {
  if (
    !rawPayload ||
    typeof rawPayload !== "object" ||
    Array.isArray(rawPayload)
  ) {
    return rawPayload;
  }

  const record = { ...(rawPayload as Record<string, unknown>) };

  if (typeof record.reply === "string") {
    record.reply = record.reply.trim();
  }

  if (Array.isArray(record.topics)) {
    const validTopics: DiaryTopic[] = [];
    const seen = new Set<string>();

    for (const item of record.topics) {
      if (typeof item === "string") {
        const upper = item.trim().toUpperCase() as DiaryTopic;
        if (VALID_TOPIC_SET.has(upper) && !seen.has(upper)) {
          seen.add(upper);
          validTopics.push(upper);
        }
      }
    }

    if (validTopics.length > 1 && validTopics.includes(DiaryTopic.LAINNYA)) {
      record.topics = validTopics.filter((t) => t !== DiaryTopic.LAINNYA);
    } else {
      record.topics = validTopics;
    }
  } else {
    record.topics = [];
  }

  if (typeof record.conversationState === "string") {
    const upperState = record.conversationState.trim().toUpperCase();
    if (VALID_STATE_SET.has(upperState)) {
      record.conversationState = upperState;
    } else {
      record.conversationState = ConversationState.EXPLORATION;
    }
  } else {
    record.conversationState = ConversationState.EXPLORATION;
  }

  if (typeof record.proactiveSuggestion === "string") {
    const trimmed = record.proactiveSuggestion.trim();
    record.proactiveSuggestion = trimmed.length > 0 ? trimmed : null;
  } else if (record.proactiveSuggestion !== null) {
    record.proactiveSuggestion = null;
  }

  if (
    record.safety &&
    typeof record.safety === "object" &&
    !Array.isArray(record.safety)
  ) {
    const safetyRecord = { ...(record.safety as Record<string, unknown>) };
    const rawRisk =
      typeof safetyRecord.riskLevel === "string"
        ? safetyRecord.riskLevel.trim().toUpperCase()
        : RiskLevel.NONE;
    const riskLevel = VALID_RISK_SET.has(rawRisk)
      ? (rawRisk as RiskLevel)
      : RiskLevel.NONE;

    if (riskLevel === RiskLevel.NONE) {
      safetyRecord.flag = false;
      safetyRecord.riskLevel = RiskLevel.NONE;
      safetyRecord.category = null;
      safetyRecord.summary = null;
    } else {
      safetyRecord.flag = true;
      safetyRecord.riskLevel = riskLevel;
      const rawCategory =
        typeof safetyRecord.category === "string"
          ? safetyRecord.category.trim().toUpperCase()
          : null;
      safetyRecord.category =
        rawCategory && VALID_CATEGORY_SET.has(rawCategory)
          ? (rawCategory as SafetyCategory)
          : SafetyCategory.OTHER;
      const rawSummary =
        typeof safetyRecord.summary === "string"
          ? safetyRecord.summary.trim()
          : "";
      safetyRecord.summary =
        rawSummary || "Perhatian keselamatan terdeteksi dalam pesan.";
    }
    record.safety = safetyRecord;
  }

  const allowedKeys = new Set([
    "reply",
    "topics",
    "conversationState",
    "proactiveSuggestion",
    "safety",
  ]);
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      delete record[key];
    }
  }

  return record;
}

export type ParseDiaryStructuredOutputOptions = {
  sanitize?: boolean;
};

export function parseDiaryStructuredOutput(
  raw: string,
  options?: ParseDiaryStructuredOutputOptions,
): DiaryStructuredOutput {
  let payload: unknown;

  const rawToParse = options?.sanitize ? extractJsonObjectString(raw) : raw;

  try {
    payload = JSON.parse(rawToParse);
  } catch {
    throw new DiaryStructuredOutputError();
  }

  if (options?.sanitize) {
    payload = sanitizeAiOutputPayload(payload);
  }

  const result = diaryStructuredOutputSchema.safeParse(payload);
  if (!result.success) {
    throw new DiaryStructuredOutputError();
  }

  return result.data;
}
