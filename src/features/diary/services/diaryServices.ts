// ============================================================
//  src/features/diary/services/diaryServices.ts
// ============================================================

import type { BraveChoiceQuiz, ChatMessage, DiaryEntry } from "../types";

type ApiErrorResponse = {
  error?: string;
};

type DiaryEntriesApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    entries?: DiaryEntry[];
    diarySessionsUsedThisMonth?: number;
  };
};

type DiaryMessagesApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    messages?: ChatMessage[];
  };
};

type BraveChoiceQuizApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    quiz?: BraveChoiceQuiz | null;
    quizUsedToday?: number;
    isQuotaReached?: boolean;
  };
};

type BraveChoiceStatusApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    quizUsedToday?: number;
    isQuotaReached?: boolean;
    hasAvailableQuestion?: boolean;
  };
};

type SubmitQuizAnswerApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    questionId?: string;
    chosenOption?: string;
    isCorrect?: boolean;
    explanation?: string;
    quizUsedToday?: number;
  };
};

type ResetBraveChoiceProgressApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    resetCount?: number;
  };
};

export type SendDiaryChatStreamResult = {
  aiMessage: ChatMessage;
  entry: DiaryEntry;
  diarySessionsUsedThisMonth: number;
};

export type GetBraveChoiceQuizResult = {
  quiz: BraveChoiceQuiz | null;
  quizUsedToday: number;
  isQuotaReached: boolean;
};

export type SubmitQuizAnswerResult = {
  questionId: string;
  chosenOption: string;
  isCorrect: boolean;
  explanation: string;
  quizUsedToday: number;
};

export type BraveChoiceStatusResult = {
  quizUsedToday: number;
  isQuotaReached: boolean;
  hasAvailableQuestion: boolean;
};

export type ResetBraveChoiceProgressResult = {
  resetCount: number;
};

type SendDiaryChatStreamOptions = {
  onChunk?: (textChunk: string) => void;
};

export async function getDiaryEntries(month: string): Promise<{
  entries: DiaryEntry[];
  diarySessionsUsedThisMonth: number;
}> {
  const timezone = getTimezone();
  const query = new URLSearchParams({
    month,
    timezone,
  }).toString();

  const response = await fetch(`/api/diary?${query}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal memuat riwayat diary. Silakan coba lagi.",
      ),
    );
  }

  const payload = (await response.json()) as DiaryEntriesApiResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Riwayat diary tidak valid.");
  }

  return {
    entries: Array.isArray(payload.data.entries) ? payload.data.entries : [],
    diarySessionsUsedThisMonth:
      typeof payload.data.diarySessionsUsedThisMonth === "number"
        ? payload.data.diarySessionsUsedThisMonth
        : 0,
  };
}

export async function getDiaryMessages(
  entryId: string,
): Promise<ChatMessage[]> {
  const timezone = getTimezone();
  const query = new URLSearchParams({
    timezone,
  }).toString();

  const response = await fetch(
    `/api/diary/${encodeURIComponent(entryId)}/messages?${query}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal memuat percakapan diary. Silakan coba lagi.",
      ),
    );
  }

  const payload = (await response.json()) as DiaryMessagesApiResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Percakapan diary tidak valid.");
  }

  return Array.isArray(payload.data.messages) ? payload.data.messages : [];
}

export async function sendChatMessageStream(
  entryId: string,
  userMessage: string,
  options: SendDiaryChatStreamOptions = {},
): Promise<SendDiaryChatStreamResult> {
  const timezone = getTimezone();
  const response = await fetch("/api/diary/chat/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      entryId,
      messageText: userMessage,
      timezone,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal mengirim pesan diary. Silakan coba lagi.",
      ),
    );
  }

  if (!response.body) {
    throw new Error("Stream diary tidak tersedia.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let doneResult: SendDiaryChatStreamResult | null = null;

  const handleSseBlock = (rawBlock: string) => {
    const parsed = parseSseBlock(rawBlock);

    if (!parsed) {
      return;
    }

    if (parsed.event === "chunk") {
      const data = asRecord(parsed.data);
      const textChunk = typeof data?.text === "string" ? data.text : "";

      if (textChunk) {
        options.onChunk?.(textChunk);
      }

      return;
    }

    if (parsed.event === "error") {
      const data = asRecord(parsed.data);
      const message =
        typeof data?.error === "string"
          ? data.error
          : "Terjadi kesalahan saat memproses chat diary.";

      throw new Error(message);
    }

    if (parsed.event === "done") {
      const data = parsed.data;

      if (isSendDiaryChatStreamResult(data)) {
        doneResult = data;
        return;
      }

      throw new Error("Balasan diary stream tidak valid.");
    }
  };

  const processBuffer = () => {
    let separatorIndex = buffer.indexOf("\n\n");

    while (separatorIndex !== -1) {
      const rawBlock = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (rawBlock) {
        handleSseBlock(rawBlock);
      }

      separatorIndex = buffer.indexOf("\n\n");
    }
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      const chunkText = decoder.decode(value, { stream: true });
      buffer += chunkText.replace(/\r\n/g, "\n");
      processBuffer();
    }

    buffer += decoder.decode().replace(/\r\n/g, "\n");
    processBuffer();

    const leftover = buffer.trim();

    if (leftover) {
      handleSseBlock(leftover);
    }
  } finally {
    reader.releaseLock();
  }

  if (!doneResult) {
    throw new Error("Balasan AI belum lengkap. Coba kirim ulang pesanmu.");
  }

  return doneResult;
}

export async function getBraveChoiceQuiz(): Promise<GetBraveChoiceQuizResult> {
  const timezone = getTimezone();
  const query = new URLSearchParams({
    timezone,
  }).toString();

  const response = await fetch(`/api/diary/brave-choice?${query}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal memuat soal BraveChoice. Silakan coba lagi.",
      ),
    );
  }

  const payload = (await response.json()) as BraveChoiceQuizApiResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Data soal BraveChoice tidak valid.");
  }

  const quizValue = payload.data.quiz;

  if (
    quizValue !== null &&
    quizValue !== undefined &&
    !isBraveChoiceQuiz(quizValue)
  ) {
    throw new Error("Format soal BraveChoice tidak valid.");
  }

  return {
    quiz: quizValue ?? null,
    quizUsedToday:
      typeof payload.data.quizUsedToday === "number"
        ? payload.data.quizUsedToday
        : 0,
    isQuotaReached: payload.data.isQuotaReached === true,
  };
}

export async function getBraveChoiceStatus(): Promise<BraveChoiceStatusResult> {
  const timezone = getTimezone();
  const query = new URLSearchParams({
    timezone,
  }).toString();

  const response = await fetch(`/api/diary/brave-choice/status?${query}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal memuat status BraveChoice. Silakan coba lagi.",
      ),
    );
  }

  const payload = (await response.json()) as BraveChoiceStatusApiResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Data status BraveChoice tidak valid.");
  }

  return {
    quizUsedToday:
      typeof payload.data.quizUsedToday === "number"
        ? payload.data.quizUsedToday
        : 0,
    isQuotaReached: payload.data.isQuotaReached === true,
    hasAvailableQuestion: payload.data.hasAvailableQuestion === true,
  };
}

export async function submitQuizAnswer(
  quizId: string,
  selectedLabel: string,
): Promise<SubmitQuizAnswerResult> {
  const timezone = getTimezone();
  const response = await fetch("/api/diary/brave-choice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId: quizId,
      chosenOption: selectedLabel,
      timezone,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal menyimpan jawaban BraveChoice. Silakan coba lagi.",
      ),
    );
  }

  const payload = (await response.json()) as SubmitQuizAnswerApiResponse;

  if (
    !payload.success ||
    !payload.data ||
    typeof payload.data.questionId !== "string" ||
    typeof payload.data.chosenOption !== "string" ||
    typeof payload.data.isCorrect !== "boolean" ||
    typeof payload.data.explanation !== "string"
  ) {
    throw new Error(payload.error || "Respons submit BraveChoice tidak valid.");
  }

  return {
    questionId: payload.data.questionId,
    chosenOption: payload.data.chosenOption,
    isCorrect: payload.data.isCorrect,
    explanation: payload.data.explanation,
    quizUsedToday:
      typeof payload.data.quizUsedToday === "number"
        ? payload.data.quizUsedToday
        : 0,
  };
}

export async function resetBraveChoiceProgress(): Promise<ResetBraveChoiceProgressResult> {
  const response = await fetch("/api/diary/brave-choice/reset", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      await extractResponseError(
        response,
        "Gagal mereset progres BraveChoice. Silakan coba lagi.",
      ),
    );
  }

  const payload =
    (await response.json()) as ResetBraveChoiceProgressApiResponse;

  if (!payload.success || !payload.data) {
    throw new Error(payload.error || "Respons reset BraveChoice tidak valid.");
  }

  return {
    resetCount:
      typeof payload.data.resetCount === "number" ? payload.data.resetCount : 0,
  };
}

function getTimezone() {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!timezone) {
      return "Asia/Jakarta";
    }

    return timezone;
  } catch {
    return "Asia/Jakarta";
  }
}

async function extractResponseError(
  response: Response,
  fallbackMessage: string,
) {
  try {
    const payload = (await response.json()) as ApiErrorResponse;

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
  } catch {
    // Ignore parsing error and fallback to generic message.
  }

  return fallbackMessage;
}

function parseSseBlock(
  rawBlock: string,
): { event: string; data: unknown } | null {
  const lines = rawBlock.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim() || "message";
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }

  if (!dataLines.length) {
    return null;
  }

  const rawData = dataLines.join("\n");

  try {
    return {
      event,
      data: JSON.parse(rawData),
    };
  } catch {
    return {
      event,
      data: rawData,
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function isDiaryEntry(value: unknown): value is DiaryEntry {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  return (
    typeof record.id === "string" &&
    typeof record.date === "string" &&
    typeof record.dateLabel === "string" &&
    typeof record.preview === "string" &&
    typeof record.mood === "number"
  );
}

function isChatMessage(value: unknown): value is ChatMessage {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  const role = record.role;

  return (
    typeof record.text === "string" &&
    typeof record.time === "string" &&
    (role === "ai" || role === "user")
  );
}

function isSendDiaryChatStreamResult(
  value: unknown,
): value is SendDiaryChatStreamResult {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  return (
    isChatMessage(record.aiMessage) &&
    isDiaryEntry(record.entry) &&
    typeof record.diarySessionsUsedThisMonth === "number"
  );
}

function isBraveChoiceOption(
  value: unknown,
): value is BraveChoiceQuiz["options"][number] {
  const record = asRecord(value);

  if (!record) {
    return false;
  }

  return (
    typeof record.label === "string" &&
    typeof record.text === "string" &&
    typeof record.isBrave === "boolean"
  );
}

function isBraveChoiceQuiz(value: unknown): value is BraveChoiceQuiz {
  const record = asRecord(value);

  if (!record || !Array.isArray(record.options)) {
    return false;
  }

  return (
    typeof record.id === "string" &&
    typeof record.scenario === "string" &&
    typeof record.explanationWrong === "string" &&
    typeof record.explanationRight === "string" &&
    record.options.every((option) => isBraveChoiceOption(option))
  );
}
