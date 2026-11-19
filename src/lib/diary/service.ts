import { Sender } from "@/app/generated/prisma/client";

import { generateDiaryAssistantReply } from "@/lib/diary/litellm";
import {
  buildDiaryPromptMessages,
  type DiaryConversationTurn,
  type DiaryPromptMessage,
} from "@/lib/diary/prompt";
import type {
  DiaryEntryDto,
  DiaryMessageDto,
  DiaryMoodScore,
} from "@/lib/diary/types";
import { encrypt, decrypt } from "@/lib/encryption";
import prisma from "@/lib/prisma";

type ListDiaryEntriesInput = {
  userId: string;
  monthKey: string;
  timezone?: string;
};

type ListDiaryMessagesInput = {
  userId: string;
  entryId: string;
  timezone?: string;
};

type SendDiaryChatInput = {
  userId: string;
  entryId: string;
  messageText: string;
  timezone?: string;
};

type DiaryMoodInitiationInput = {
  userId: string;
  moodScore: number;
  notes: string;
  timezone?: string;
};

type DiaryMessageRecord = {
  id: string;
  senderType: Sender;
  content: string;
  createdAt: Date;
};

const DEFAULT_TIMEZONE = "Asia/Jakarta";
const FREE_DIARY_LIMIT_PER_MONTH = 15;
const MAX_PROMPT_HISTORY_MESSAGES = 32;
const PREVIEW_MAX_LENGTH = 96;
const PERSIST_TRANSACTION_MAX_WAIT_MS = 10_000;
const PERSIST_TRANSACTION_TIMEOUT_MS = 20_000;

export class DiaryServiceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "DIARY_ERROR") {
    super(message);
    this.name = "DiaryServiceError";
    this.status = status;
    this.code = code;
  }
}

export async function getTotalDiaryCount(userId: string) {
  return prisma.diary.count({
    where: {
      userId,
      isActive: true,
    },
  });
}

export async function listDiaryEntriesByMonth({
  userId,
  monthKey,
  timezone,
}: ListDiaryEntriesInput) {
  const tz = normalizeTimezone(timezone);
  const todayKey = getDateKeyInTimeZone(new Date(), tz);
  const { startDate, endDate } = getMonthRange(monthKey);

  const [diaries, diarySessionsUsedThisMonth] = await prisma.$transaction([
    prisma.diary.findMany({
      where: {
        userId,
        isActive: true,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 12,
          select: {
            id: true,
            senderType: true,
            content: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.diary.count({
      where: {
        userId,
        isActive: true,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),
  ]);

  // Decrypt contents
  const decryptedDiaries = diaries.map((diary) => ({
    ...diary,
    messages: diary.messages.map((msg) => ({
      ...msg,
      content: decrypt(msg.content),
    })),
  }));

  const entries = decryptedDiaries
    .map((diary) => toDiaryEntryDto(diary.id, diary.date, diary.messages, tz))
    .map((entry) => ({
      ...entry,
      isToday: entry.date === todayKey,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (
    monthKey === todayKey.slice(0, 7) &&
    !entries.some((entry) => entry.isToday)
  ) {
    entries.unshift(createVirtualTodayEntry(todayKey, tz));
  }

  return {
    entries,
    diarySessionsUsedThisMonth,
  };
}

export async function listDiaryMessagesByEntryId({
  userId,
  entryId,
  timezone,
}: ListDiaryMessagesInput) {
  const tz = normalizeTimezone(timezone);
  const diary = await findDiaryForUser({ userId, entryId, timezone: tz });

  if (!diary) {
    return [];
  }

  const messages = await prisma.diaryMessage.findMany({
    where: { diaryId: diary.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderType: true,
      content: true,
      createdAt: true,
    },
  });

  const decryptedMessages = messages.map((msg) => ({
    ...msg,
    content: decrypt(msg.content),
  }));

  return decryptedMessages.map((message) => toDiaryMessageDto(message, tz));
}

export type PreparedDiaryChatSession = {
  userId: string;
  timezone: string;
  diary: {
    id: string;
    date: Date;
  } | null;
  todayKey: string;
  todayDate: Date;
  trimmedText: string;
  promptHistory: DiaryMessageRecord[];
  promptMessages: DiaryPromptMessage[];
};

export async function prepareDiaryChatSession({
  userId,
  entryId,
  messageText,
  timezone,
}: SendDiaryChatInput): Promise<PreparedDiaryChatSession> {
  const tz = normalizeTimezone(timezone);
  const trimmedText = messageText.trim();

  if (!trimmedText) {
    throw new DiaryServiceError(
      "Pesan tidak boleh kosong.",
      400,
      "EMPTY_MESSAGE",
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      isPremium: true,
    },
  });

  if (!user) {
    throw new DiaryServiceError("User tidak ditemukan.", 404, "USER_NOT_FOUND");
  }

  const todayKey = getDateKeyInTimeZone(new Date(), tz);
  const todayDate = parseDateKeyToUTCDate(todayKey);

  const diary = await findDiaryForUser({
    userId,
    entryId,
    timezone: tz,
  });

  if (diary && getDateKeyInTimeZone(diary.date, tz) !== todayKey) {
    throw new DiaryServiceError(
      "Entri lampau tidak bisa ditulis lagi. Pilih entri hari ini.",
      403,
      "READ_ONLY_ENTRY",
    );
  }

  if (!diary) {
    if (!user.isPremium) {
      const { startDate, endDate } = getMonthRange(todayKey.slice(0, 7));
      const usedSessions = await prisma.diary.count({
        where: {
          userId,
          isActive: true,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      if (usedSessions >= FREE_DIARY_LIMIT_PER_MONTH) {
        throw new DiaryServiceError(
          `Batas ${FREE_DIARY_LIMIT_PER_MONTH} sesi diary bulan ini tercapai.`,
          403,
          "DIARY_QUOTA_EXCEEDED",
        );
      }
    }
  }

  const rawPromptHistory = diary
    ? await prisma.diaryMessage.findMany({
        where: { diaryId: diary.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          senderType: true,
          content: true,
          createdAt: true,
        },
      })
    : [];

  const promptHistory = rawPromptHistory.map((m) => ({
    ...m,
    content: decrypt(m.content),
  }));

  const promptHistoryWithIncomingMessage: DiaryMessageRecord[] = [
    ...promptHistory,
    {
      id: "pending-user-message",
      senderType: Sender.USER,
      content: trimmedText,
      createdAt: new Date(),
    },
  ];

  const conversationForPrompt = promptHistoryWithIncomingMessage
    .slice(-MAX_PROMPT_HISTORY_MESSAGES)
    .map<DiaryConversationTurn>((message) => ({
      role: message.senderType === Sender.AI ? "assistant" : "user",
      content: message.content,
    }));

  const todayLabel = formatDateLabel(todayDate, tz);
  const promptMessages = buildDiaryPromptMessages({
    userName: user.name || "Teman",
    todayLabel,
    conversation: conversationForPrompt,
  });

  return {
    userId,
    timezone: tz,
    diary,
    todayKey,
    todayDate,
    trimmedText,
    promptHistory,
    promptMessages,
  };
}

export async function persistDiaryChatSession({
  session,
  assistantText,
}: {
  session: PreparedDiaryChatSession;
  assistantText: string;
}) {
  const normalizedAssistantText = assistantText.trim();

  if (!normalizedAssistantText) {
    throw new DiaryServiceError(
      "AI belum memberikan balasan. Coba kirim ulang pesanmu.",
      502,
      "AI_EMPTY_RESPONSE",
    );
  }

  const persisted = await prisma.$transaction(
    async (tx) => {
      const finalDiary = session.diary
        ? session.diary
        : await tx.diary.create({
            data: {
              userId: session.userId,
              date: session.todayDate,
              isActive: true,
            },
            select: {
              id: true,
              date: true,
            },
          });

      const userMessage = await tx.diaryMessage.create({
        data: {
          diaryId: finalDiary.id,
          senderType: Sender.USER,
          content: encrypt(session.trimmedText),
        },
        select: {
          id: true,
          senderType: true,
          content: true,
          createdAt: true,
        },
      });

      const aiMessage = await tx.diaryMessage.create({
        data: {
          diaryId: finalDiary.id,
          senderType: Sender.AI,
          content: encrypt(normalizedAssistantText),
        },
        select: {
          id: true,
          senderType: true,
          content: true,
          createdAt: true,
        },
      });

      return {
        finalDiary,
        userMessage: {
          ...userMessage,
          content: session.trimmedText,
        },
        aiMessage: {
          ...aiMessage,
          content: normalizedAssistantText,
        },
      };
    },
    {
      maxWait: PERSIST_TRANSACTION_MAX_WAIT_MS,
      timeout: PERSIST_TRANSACTION_TIMEOUT_MS,
    },
  );

  const fullMessagesForEntry: DiaryMessageRecord[] = [
    ...session.promptHistory,
    persisted.userMessage,
    persisted.aiMessage,
  ];

  const { startDate, endDate } = getMonthRange(session.todayKey.slice(0, 7));
  const diarySessionsUsedThisMonth = await prisma.diary.count({
    where: {
      userId: session.userId,
      isActive: true,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return {
    aiMessage: toDiaryMessageDto(persisted.aiMessage, session.timezone),
    entry: {
      ...toDiaryEntryDto(
        persisted.finalDiary.id,
        persisted.finalDiary.date,
        fullMessagesForEntry,
        session.timezone,
      ),
      isToday: true,
    },
    diarySessionsUsedThisMonth,
  };
}

export async function ensureDiaryShellFromMood({
  userId,
  timezone,
}: {
  userId: string;
  timezone?: string;
}) {
  const tz = normalizeTimezone(timezone);
  const todayKey = getDateKeyInTimeZone(new Date(), tz);
  const todayDate = parseDateKeyToUTCDate(todayKey);

  const existingDiary = await prisma.diary.findFirst({
    where: {
      userId,
      date: todayDate,
      isActive: true,
    },
    include: {
      messages: {
        take: 1,
      },
    },
  });

  if (existingDiary) {
    return {
      diaryId: existingDiary.id,
      shouldGenerateGreeting: existingDiary.messages.length === 0,
      timezone: tz,
      todayDate,
    };
  }

  const diary = await prisma.diary.create({
    data: {
      userId,
      date: todayDate,
      isActive: true,
    },
    select: { id: true },
  });

  return {
    diaryId: diary.id,
    shouldGenerateGreeting: true,
    timezone: tz,
    todayDate,
  };
}

export async function generateDiaryGreetingFromMood({
  userId,
  moodScore,
  notes,
  timezone,
  diaryId,
  todayDate,
}: DiaryMoodInitiationInput & {
  diaryId: string;
  todayDate: Date;
  timezone: string;
}) {
  const existingMessageCount = await prisma.diaryMessage.count({
    where: { diaryId },
  });

  if (existingMessageCount > 0) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const moodDesc = getMoodDescription(moodScore);
  const aiPrompt = `(Sistem: User baru saja melakukan check-in hari ini. Ia merasa ${moodDesc}.${
    notes ? ` Catatan yang ia tulis: "${notes}".` : ""
  } Berikan sapaan pertama yang ramah, berempati dengan perasaannya sekarang, dan pancing ia untuk mulai bercerita di diary. Berbicaralah sesuai dengan persona sistemmu tanpa menyebutkan secara eksplisit bahwa instruksi ini berasal dari sistem.)`;

  const todayLabel = formatDateLabel(todayDate, timezone);
  const promptMessages = buildDiaryPromptMessages({
    userName: user?.name || "Teman",
    todayLabel,
    conversation: [
      {
        role: "user",
        content: aiPrompt,
      },
    ],
  });

  try {
    const assistantText = await generateDiaryAssistantReply({
      messages: promptMessages,
    });

    if (assistantText.trim()) {
      const latestMessageCount = await prisma.diaryMessage.count({
        where: { diaryId },
      });

      if (latestMessageCount > 0) {
        return;
      }

      await prisma.diaryMessage.create({
        data: {
          diaryId: diaryId,
          senderType: Sender.AI,
          content: encrypt(assistantText.trim()),
        },
      });
    }
  } catch (error) {
    console.error("Gagal menginisiasi diary dari mood:", error);
  }
}

export async function initiateDiaryFromMood(input: DiaryMoodInitiationInput) {
  const diaryShell = await ensureDiaryShellFromMood({
    userId: input.userId,
    timezone: input.timezone,
  });

  if (!diaryShell.shouldGenerateGreeting) {
    return;
  }

  await generateDiaryGreetingFromMood({
    ...input,
    diaryId: diaryShell.diaryId,
    todayDate: diaryShell.todayDate,
    timezone: diaryShell.timezone,
  });
}

function getMoodDescription(score: number): string {
  switch (score) {
    case 5:
      return "sangat senang";
    case 4:
      return "senang";
    case 3:
      return "biasa saja";
    case 2:
      return "sedih";
    case 1:
      return "sangat sedih";
    default:
      return "biasa saja";
  }
}

export function toDiaryServiceErrorForAiFailure(error: unknown) {
  if (error instanceof DiaryServiceError) {
    return error;
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : "AI sedang tidak tersedia. Coba kirim lagi.";

  if (
    /respons kosong|response kosong|empty response|empty assistant text/i.test(
      rawMessage,
    )
  ) {
    return new DiaryServiceError(
      "AI belum memberikan balasan. Coba kirim ulang pesanmu.",
      502,
      "AI_EMPTY_RESPONSE",
    );
  }

  if (
    /expired transaction|timeout for this transaction|transaction api error|\bP2028\b/i.test(
      rawMessage,
    )
  ) {
    return new DiaryServiceError(
      "Penyimpanan chat sedang sibuk. Coba kirim ulang pesanmu.",
      503,
      "DIARY_PERSIST_TIMEOUT",
    );
  }

  return new DiaryServiceError(rawMessage, 503, "AI_UNAVAILABLE");
}

export async function sendDiaryChatMessage(input: SendDiaryChatInput) {
  const session = await prepareDiaryChatSession(input);

  let assistantText = "";

  try {
    assistantText = await generateDiaryAssistantReply({
      messages: session.promptMessages,
    });
  } catch (error) {
    console.error("Diary AI generation error:", error);

    throw toDiaryServiceErrorForAiFailure(error);
  }

  try {
    return await persistDiaryChatSession({
      session,
      assistantText,
    });
  } catch (error) {
    throw toDiaryServiceErrorForAiFailure(error);
  }
}

async function findDiaryForUser({
  userId,
  entryId,
  timezone,
}: {
  userId: string;
  entryId: string;
  timezone: string;
}) {
  if (entryId === "today") {
    const todayDate = parseDateKeyToUTCDate(
      getDateKeyInTimeZone(new Date(), timezone),
    );

    return prisma.diary.findFirst({
      where: {
        userId,
        isActive: true,
        date: todayDate,
      },
      select: {
        id: true,
        date: true,
      },
    });
  }

  return prisma.diary.findFirst({
    where: {
      id: entryId,
      userId,
      isActive: true,
    },
    select: {
      id: true,
      date: true,
    },
  });
}

function toDiaryEntryDto(
  id: string,
  date: Date,
  messages: DiaryMessageRecord[],
  timezone: string,
): DiaryEntryDto {
  const sortedMessages = [...messages].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const dateKey = getDateKeyInTimeZone(date, timezone);

  return {
    id,
    date: dateKey,
    dateLabel: formatDateLabel(date, timezone),
    preview: buildEntryPreview(sortedMessages),
    mood: estimateMoodScore(sortedMessages),
    isToday: false,
  };
}

function createVirtualTodayEntry(
  todayKey: string,
  timezone: string,
): DiaryEntryDto {
  const todayDate = parseDateKeyToUTCDate(todayKey);

  return {
    id: "today",
    date: todayKey,
    dateLabel: formatDateLabel(todayDate, timezone),
    preview: "Mulai menulis diary hari ini.",
    mood: 3,
    isToday: true,
  };
}

function toDiaryMessageDto(
  message: DiaryMessageRecord,
  timezone: string,
): DiaryMessageDto {
  return {
    id: message.id,
    role: message.senderType === Sender.AI ? "ai" : "user",
    text: message.content,
    time: formatTimeLabel(message.createdAt, timezone),
  };
}

function buildEntryPreview(messages: DiaryMessageRecord[]) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.senderType === Sender.USER);

  if (latestUserMessage?.content?.trim()) {
    return truncate(latestUserMessage.content.trim(), PREVIEW_MAX_LENGTH);
  }

  const latestAnyMessage = [...messages]
    .reverse()
    .find((message) => Boolean(message.content?.trim()));

  if (latestAnyMessage?.content?.trim()) {
    return truncate(latestAnyMessage.content.trim(), PREVIEW_MAX_LENGTH);
  }

  return "Belum ada pesan di entri ini.";
}

function estimateMoodScore(messages: DiaryMessageRecord[]): DiaryMoodScore {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.senderType === Sender.USER);

  if (!latestUserMessage) {
    return 3;
  }

  const text = latestUserMessage.content.toLowerCase();

  const positiveKeywords = [
    "senang",
    "bahagia",
    "lega",
    "tenang",
    "syukur",
    "bangga",
    "semangat",
    "baik",
  ];

  const negativeKeywords = [
    "sedih",
    "cemas",
    "takut",
    "marah",
    "capek",
    "lelah",
    "bingung",
    "stres",
  ];

  const positiveHits = positiveKeywords.filter((keyword) =>
    text.includes(keyword),
  ).length;
  const negativeHits = negativeKeywords.filter((keyword) =>
    text.includes(keyword),
  ).length;

  const score = 3 + positiveHits - negativeHits;

  if (score <= 1) {
    return 1;
  }

  if (score === 2) {
    return 2;
  }

  if (score === 3) {
    return 3;
  }

  if (score === 4) {
    return 4;
  }

  return 5;
}

function normalizeTimezone(timezone?: string) {
  if (!timezone?.trim()) {
    return DEFAULT_TIMEZONE;
  }

  return timezone;
}

function getMonthRange(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    throw new DiaryServiceError(
      "Parameter month tidak valid.",
      400,
      "INVALID_MONTH",
    );
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));

  return {
    startDate,
    endDate,
  };
}

function parseDateKeyToUTCDate(dateKey: string) {
  const [yearStr, monthStr, dayStr] = dateKey.split("-");

  return new Date(
    Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)),
  );
}

function getDateKeyInTimeZone(date: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw new Error("Tanggal tidak dapat diformat.");
    }

    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

function formatDateLabel(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: timezone,
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }
}

function formatTimeLabel(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(":", ".");
  } catch {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(date)
      .replace(":", ".");
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}
