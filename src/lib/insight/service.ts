import OpenAI from "openai";

import { Priority } from "@/app/generated/prisma/client";
import { decrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";
import { getLocalDateString, parseDateString } from "@/lib/mood/service";
import { syncUserPremiumStatus } from "@/lib/subscription/service";

const DEFAULT_BASE_URL = "https://api.koboillm.com/v1";
const DEFAULT_MODEL = "openai/gpt-5-mini";
const DEFAULT_TIMEZONE = "Asia/Jakarta";

const apiKey = process.env.API_KEY || "";
const baseUrl = (process.env.BASE_URL || DEFAULT_BASE_URL)
  .trim()
  .replace(/\/$/, "");

const openai = new OpenAI({
  apiKey,
  baseURL: baseUrl,
});

type InsightActionResult = {
  priority?: string;
  label?: string;
  desc?: string;
};

type InsightModelResult = {
  averageScore?: number | string;
  analysisText?: string;
  cognitivePattern?: string;
  affirmation?: string;
  recommendations?: InsightActionResult[];
};

export class InsightServiceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "INSIGHT_ERROR") {
    super(message);
    this.name = "InsightServiceError";
    this.status = status;
    this.code = code;
  }
}

export function normalizeTimezone(timezone?: string | null) {
  return timezone?.trim() || DEFAULT_TIMEZONE;
}

export function assertDateKey(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new InsightServiceError(
      "Format tanggal harus YYYY-MM-DD.",
      400,
      "INVALID_DATE",
    );
  }

  return date;
}

export async function getInsightMapForUser(userId: string) {
  await assertPremiumUser(userId);

  const insights = await prisma.insight.findMany({
    where: { userId },
    include: {
      recommendations: true,
    },
    orderBy: { date: "asc" },
  });

  return Object.fromEntries(
    insights.map((insight) => {
      const dateString = insight.date.toISOString().split("T")[0];
      const actions = insight.recommendations.map((recommendation) => {
        const parsedAction = parseActionText(recommendation.actionText);

        return {
          priority: toClientPriority(recommendation.priority),
          label: parsedAction.label,
          desc: parsedAction.desc,
        };
      });

      return [
        dateString,
        {
          mood: Number(insight.averageScore) || 0,
          reflection: insight.analysisText,
          pattern: insight.cognitivePattern || "",
          affirmation: insight.affirmation || "",
          actions,
        },
      ];
    }),
  );
}

export async function generateDailyInsight({
  userId,
  date,
  timezone,
}: {
  userId: string;
  date: string;
  timezone?: string | null;
}) {
  const dateKey = assertDateKey(date);
  const tz = normalizeTimezone(timezone);
  const targetDate = parseDateString(dateKey);

  await assertPremiumUser(userId);

  const existingInsight = await prisma.insight.findFirst({
    where: {
      userId,
      date: targetDate,
    },
  });

  if (existingInsight) {
    throw new InsightServiceError(
      "Insight untuk tanggal ini sudah ada.",
      400,
      "INSIGHT_EXISTS",
    );
  }

  const [allMoodLogs, diaries] = await Promise.all([
    prisma.moodLog.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.diary.findMany({
      where: {
        userId,
        isActive: true,
        date: targetDate,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  const moodLogs = allMoodLogs.filter(
    (log) => getLocalDateString(log.createdAt, tz) === dateKey,
  );

  const messages = diaries
    .flatMap((diary) => diary.messages)
    .map((message) => ({
      senderType: message.senderType,
      content: decrypt(message.content),
    }))
    .filter((message) => message.content.trim().length > 0);

  if (messages.length === 0) {
    throw new InsightServiceError(
      "Harus ada minimal percakapan di dalam TemanCerita untuk generate insight tanggal ini.",
      400,
      "NO_DIARY_MESSAGES",
    );
  }

  const promptText = buildInsightPrompt({
    dateKey,
    timezone: tz,
    moodLogs: moodLogs.map((mood) => ({
      score: mood.moodScore,
      note: mood.note || "",
    })),
    conversation: messages.map((message) => ({
      role: message.senderType,
      content: message.content,
    })),
  });
  const sensitiveSources = [
    ...moodLogs.map((mood) => mood.note || ""),
    ...messages.map((message) => message.content),
  ];

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Kamu membantu membuat insight harian TemanTumbuh. Jawab hanya JSON valid, ringkas, tenang, dan menjaga privasi pengguna.",
      },
      { role: "user", content: promptText },
    ],
    response_format: { type: "json_object" },
  });

  const completionText = completion.choices[0]?.message?.content || "";
  if (!completionText) {
    throw new InsightServiceError(
      "Gagal generate insight dari model.",
      500,
      "EMPTY_MODEL_RESPONSE",
    );
  }

  const insightResult = parseModelResult(completionText);
  const averageScore = clampMoodScore(Number(insightResult.averageScore) || 3);
  const recommendations = Array.isArray(insightResult.recommendations)
    ? insightResult.recommendations
    : [];

  return prisma.insight.create({
    data: {
      userId,
      date: targetDate,
      averageScore,
      analysisText: makePrivacySafeText(
        insightResult.analysisText,
        sensitiveSources,
        "Hari ini memuat beberapa emosi yang perlu ditemani dengan tenang, tanpa membuka detail cerita pribadi.",
      ),
      cognitivePattern: makePrivacySafeText(
        insightResult.cognitivePattern,
        sensitiveSources,
        "Ada pola emosi umum yang perlu diperhatikan tanpa menyebut detail percakapan.",
      ),
      affirmation: makePrivacySafeText(
        insightResult.affirmation,
        sensitiveSources,
        "Kamu tetap berharga dan boleh berjalan pelan hari ini.",
      ),
      recommendations: {
        create: recommendations.slice(0, 3).map((recommendation) => ({
          priority: toDbPriority(recommendation.priority),
          actionText: JSON.stringify({
            label:
              makePrivacySafeText(
                recommendation.label,
                sensitiveSources,
                "Langkah kecil",
              ) || "Langkah kecil",
            desc:
              makePrivacySafeText(
                recommendation.desc,
                sensitiveSources,
                "Pilih satu hal ringan yang terasa aman untuk dilakukan hari ini.",
              ) ||
              "Pilih satu hal ringan yang terasa aman untuk dilakukan hari ini.",
          }),
        })),
      },
    },
    include: {
      recommendations: true,
    },
  });
}

async function assertPremiumUser(userId: string) {
  const premiumStatus = await syncUserPremiumStatus(userId);

  if (!premiumStatus.isPremium) {
    throw new InsightServiceError(
      "Membutuhkan premium account",
      403,
      "PREMIUM_REQUIRED",
    );
  }
}

function buildInsightPrompt({
  dateKey,
  timezone,
  moodLogs,
  conversation,
}: {
  dateKey: string;
  timezone: string;
  moodLogs: Array<{ score: number; note: string }>;
  conversation: Array<{ role: string; content: string }>;
}) {
  const moodData = moodLogs.length
    ? moodLogs
        .map(
          (mood, index) =>
            `${index + 1}. Skor ${mood.score}/5${
              mood.note ? `, catatan: ${mood.note}` : ""
            }`,
        )
        .join("\n")
    : "Tidak ada mood check-in untuk tanggal ini.";

  const conversationData = conversation
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  return `Analisis data harian pengguna TemanTumbuh untuk tanggal ${dateKey} (${timezone}).

Tugas:
1. Tentukan averageScore 1-5 mengenai kondisi emosional dengan mapping yang konsisten:
   1 = sangat berat/perlu perhatian besar
   2 = menurun/perlu dijaga
   3 = netral atau cukup stabil
   4 = baik/lebih ringan
   5 = sangat baik/positif
   Skor harus selaras dengan mood check-in, notes, dan percakapan, bukan dibuat hiperbola.
2. analysisText adalah ringkasan aman privasi: jelaskan suasana umum hari itu tanpa mengutip isi diary, nama orang, lokasi, konflik detail, atau data pribadi.
3. cognitivePattern cukup pola umum yang terlihat, misalnya overthinking, menahan emosi, butuh jeda, atau mulai mampu menenangkan diri. Jangan memberi diagnosis.
4. affirmation harus tenang, tidak dramatis, dan sesuai kondisi mood.
5. recommendations berisi maksimal 3 langkah konkret, pendek, dan relevan.

Output hanya JSON:
{
  "averageScore": number,
  "analysisText": string,
  "cognitivePattern": string,
  "affirmation": string,
  "recommendations": [
    {
      "priority": "TINGGI" | "SEDANG" | "RENDAH",
      "label": string,
      "desc": string
    }
  ]
}

Mood Logs:
${moodData}

Percakapan Diary:
${conversationData}`;
}

function parseModelResult(raw: string): InsightModelResult {
  try {
    return JSON.parse(raw) as InsightModelResult;
  } catch {
    throw new InsightServiceError(
      "Format respon model tidak valid.",
      500,
      "INVALID_MODEL_JSON",
    );
  }
}

function parseActionText(actionText: string) {
  try {
    const parsed = JSON.parse(actionText) as {
      label?: unknown;
      desc?: unknown;
    };

    return {
      label:
        typeof parsed.label === "string" && parsed.label.trim()
          ? parsed.label
          : "Tindakan",
      desc:
        typeof parsed.desc === "string" && parsed.desc.trim()
          ? parsed.desc
          : actionText,
    };
  } catch {
    return {
      label: "Tindakan",
      desc: actionText,
    };
  }
}

function toClientPriority(priority: Priority) {
  if (priority === Priority.TINGGI) return "High";
  if (priority === Priority.SEDANG) return "Medium";
  return "Low";
}

function toDbPriority(priority?: string) {
  if (priority === Priority.TINGGI) return Priority.TINGGI;
  if (priority === Priority.RENDAH) return Priority.RENDAH;
  return Priority.SEDANG;
}

function clampMoodScore(score: number) {
  if (score <= 1) return 1;
  if (score >= 5) return 5;
  return Number(score.toFixed(1));
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function makePrivacySafeText(
  value: unknown,
  sensitiveSources: string[],
  fallback: string,
) {
  const text = cleanText(value);
  if (!text) {
    return "";
  }

  const normalizedText = normalizeForPrivacyCompare(text);
  const leaksSensitiveSource = sensitiveSources.some((source) => {
    const normalizedSource = normalizeForPrivacyCompare(source);

    if (normalizedSource.length < 12) {
      return false;
    }

    return (
      normalizedText.includes(normalizedSource) ||
      normalizedSource.includes(normalizedText)
    );
  });

  return leaksSensitiveSource ? fallback : text;
}

function normalizeForPrivacyCompare(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}
