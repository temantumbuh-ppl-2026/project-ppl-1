import { AgeSegment, Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

type BraveChoiceOptionLabel = "A" | "B";

export type BraveChoiceQuizOptionDto = {
  label: BraveChoiceOptionLabel;
  text: string;
  isBrave: boolean;
};

export type BraveChoiceQuizDto = {
  id: string;
  category: string;
  scenario: string;
  options: BraveChoiceQuizOptionDto[];
  explanationWrong: string;
  explanationRight: string;
};

type GetBraveChoiceQuizInput = {
  userId: string;
  timezone?: string;
};

type SubmitBraveChoiceAnswerInput = {
  userId: string;
  questionId: string;
  chosenOption: string;
  timezone?: string;
};

type ResetBraveChoiceProgressInput = {
  userId: string;
};

export type GetBraveChoiceQuizResult = {
  quiz: BraveChoiceQuizDto | null;
  quizUsedToday: number;
  isQuotaReached: boolean;
};

export type SubmitBraveChoiceAnswerResult = {
  questionId: string;
  chosenOption: BraveChoiceOptionLabel;
  isCorrect: boolean;
  explanation: string;
  quizUsedToday: number;
};

export type ResetBraveChoiceProgressResult = {
  resetCount: number;
};

export type BraveChoiceStatusResult = {
  quizUsedToday: number;
  isQuotaReached: boolean;
  hasAvailableQuestion: boolean;
};

type UserQuizContext = {
  isPremium: boolean;
  ageSegment: AgeSegment;
};

const DEFAULT_TIMEZONE = "Asia/Jakarta";
const FREE_QUIZ_LIMIT_PER_DAY = 5;

export class BraveChoiceServiceError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BRAVE_CHOICE_ERROR") {
    super(message);
    this.name = "BraveChoiceServiceError";
    this.status = status;
    this.code = code;
  }
}

export async function getBraveChoiceQuizForUser({
  userId,
  timezone,
}: GetBraveChoiceQuizInput): Promise<GetBraveChoiceQuizResult> {
  const normalizedTimezone = normalizeTimezone(timezone);
  const status = await getBraveChoiceStatusForUser({
    userId,
    timezone: normalizedTimezone,
  });

  if (status.isQuotaReached) {
    return {
      quiz: null,
      quizUsedToday: status.quizUsedToday,
      isQuotaReached: true,
    };
  }

  const userContext = await getUserQuizContext(userId);
  const solvedCorrectQuestionIds = await getSolvedCorrectQuestionIds({
    userId,
  });

  const availableQuestion = await findRandomAvailableQuestion({
    ageSegment: userContext.ageSegment,
    excludedQuestionIds: solvedCorrectQuestionIds,
  });

  if (!availableQuestion) {
    return {
      quiz: null,
      quizUsedToday: status.quizUsedToday,
      isQuotaReached: false,
    };
  }

  const normalizedCorrectOption = normalizeOptionLabel(
    availableQuestion.correctOption,
  );

  if (!normalizedCorrectOption) {
    throw new BraveChoiceServiceError(
      "Data opsi jawaban pada soal tidak valid.",
      500,
      "INVALID_QUESTION_OPTION",
    );
  }

  return {
    quiz: {
      id: availableQuestion.id,
      category: availableQuestion.category,
      scenario: availableQuestion.scenario,
      options: [
        {
          label: "A",
          text: availableQuestion.optionA,
          isBrave: normalizedCorrectOption === "A",
        },
        {
          label: "B",
          text: availableQuestion.optionB,
          isBrave: normalizedCorrectOption === "B",
        },
      ],
      explanationWrong: availableQuestion.explanationIncorrect,
      explanationRight: availableQuestion.explanationCorrect,
    },
    quizUsedToday: status.quizUsedToday,
    isQuotaReached: false,
  };
}

export async function getBraveChoiceStatusForUser({
  userId,
  timezone,
}: GetBraveChoiceQuizInput): Promise<BraveChoiceStatusResult> {
  const normalizedTimezone = normalizeTimezone(timezone);

  const [userContext, quizUsedToday] = await Promise.all([
    getUserQuizContext(userId),
    countQuizUsageToday(userId, normalizedTimezone),
  ]);

  const isQuotaReached =
    !userContext.isPremium && quizUsedToday >= FREE_QUIZ_LIMIT_PER_DAY;

  if (isQuotaReached) {
    return {
      quizUsedToday,
      isQuotaReached: true,
      hasAvailableQuestion: false,
    };
  }

  const solvedCorrectQuestionIds = await getSolvedCorrectQuestionIds({
    userId,
  });

  const hasAvailableQuestion = await checkHasAvailableQuestion({
    ageSegment: userContext.ageSegment,
    excludedQuestionIds: solvedCorrectQuestionIds,
  });

  return {
    quizUsedToday,
    isQuotaReached: false,
    hasAvailableQuestion,
  };
}

export async function submitBraveChoiceAnswerForUser({
  userId,
  questionId,
  chosenOption,
  timezone,
}: SubmitBraveChoiceAnswerInput): Promise<SubmitBraveChoiceAnswerResult> {
  const normalizedTimezone = normalizeTimezone(timezone);
  const normalizedChosenOption = normalizeOptionLabel(chosenOption);

  if (!normalizedChosenOption) {
    throw new BraveChoiceServiceError(
      "Pilihan jawaban harus A atau B.",
      400,
      "INVALID_OPTION",
    );
  }

  const [userContext, quizUsedTodayBefore] = await Promise.all([
    getUserQuizContext(userId),
    countQuizUsageToday(userId, normalizedTimezone),
  ]);

  if (
    !userContext.isPremium &&
    quizUsedTodayBefore >= FREE_QUIZ_LIMIT_PER_DAY
  ) {
    throw new BraveChoiceServiceError(
      `Batas ${FREE_QUIZ_LIMIT_PER_DAY} soal BraveChoice per hari sudah tercapai.`,
      403,
      "QUIZ_QUOTA_EXCEEDED",
    );
  }

  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: {
      id: true,
      ageSegment: true,
      isActive: true,
      correctOption: true,
      explanationCorrect: true,
      explanationIncorrect: true,
    },
  });

  if (!question || !question.isActive) {
    throw new BraveChoiceServiceError(
      "Soal BraveChoice tidak ditemukan.",
      404,
      "QUESTION_NOT_FOUND",
    );
  }

  if (question.ageSegment !== userContext.ageSegment) {
    throw new BraveChoiceServiceError(
      "Soal ini bukan untuk segmen usiamu.",
      403,
      "AGE_SEGMENT_MISMATCH",
    );
  }

  const normalizedCorrectOption = normalizeOptionLabel(question.correctOption);

  if (!normalizedCorrectOption) {
    throw new BraveChoiceServiceError(
      "Data opsi jawaban pada soal tidak valid.",
      500,
      "INVALID_QUESTION_OPTION",
    );
  }

  const isCorrectSelection = normalizedChosenOption === normalizedCorrectOption;

  await prisma.quizLog.create({
    data: {
      userId,
      questionId: question.id,
      chosenOption: normalizedChosenOption,
      isCorrect: isCorrectSelection,
    },
  });

  const quizUsedToday = quizUsedTodayBefore + 1;

  return {
    questionId: question.id,
    chosenOption: normalizedChosenOption,
    isCorrect: isCorrectSelection,
    explanation: isCorrectSelection
      ? question.explanationCorrect
      : question.explanationIncorrect,
    quizUsedToday,
  };
}

export async function resetBraveChoiceProgressForUser({
  userId,
}: ResetBraveChoiceProgressInput): Promise<ResetBraveChoiceProgressResult> {
  const updated = await prisma.quizLog.updateMany({
    where: {
      userId,
    },
    data: {
      isCorrect: false,
    },
  });

  return {
    resetCount: updated.count,
  };
}

async function getUserQuizContext(userId: string): Promise<UserQuizContext> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      birthYear: true,
      isPremium: true,
    },
  });

  if (!user) {
    throw new BraveChoiceServiceError(
      "User tidak ditemukan.",
      404,
      "USER_NOT_FOUND",
    );
  }

  return {
    isPremium: Boolean(user.isPremium),
    ageSegment: resolveAgeSegment(user.birthYear),
  };
}

async function getSolvedCorrectQuestionIds({
  userId,
}: {
  userId: string;
}): Promise<string[]> {
  const solvedLogs = await prisma.quizLog.findMany({
    where: {
      userId,
      isCorrect: true,
    },
    select: {
      questionId: true,
    },
    distinct: ["questionId"],
  });

  return solvedLogs.map((log) => log.questionId);
}

async function findRandomAvailableQuestion({
  ageSegment,
  excludedQuestionIds,
}: {
  ageSegment: AgeSegment;
  excludedQuestionIds: string[];
}) {
  const whereClause: Prisma.QuizQuestionWhereInput = {
    isActive: true,
    ageSegment,
  };

  if (excludedQuestionIds.length > 0) {
    whereClause.id = {
      notIn: excludedQuestionIds,
    };
  }

  const questions = await prisma.quizQuestion.findMany({
    where: whereClause,
    select: {
      id: true,
      category: true,
      scenario: true,
      optionA: true,
      optionB: true,
      correctOption: true,
      explanationCorrect: true,
      explanationIncorrect: true,
    },
  });

  if (questions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex] || null;
}

async function checkHasAvailableQuestion({
  ageSegment,
  excludedQuestionIds,
}: {
  ageSegment: AgeSegment;
  excludedQuestionIds: string[];
}) {
  const whereClause: Prisma.QuizQuestionWhereInput = {
    isActive: true,
    ageSegment,
  };

  if (excludedQuestionIds.length > 0) {
    whereClause.id = {
      notIn: excludedQuestionIds,
    };
  }

  const count = await prisma.quizQuestion.count({
    where: whereClause,
  });

  return count > 0;
}

async function countQuizUsageToday(userId: string, timezone: string) {
  const quizLogs = await prisma.quizLog.findMany({
    where: { userId },
    select: { createdAt: true },
  });

  const todayKey = getDateKeyInTimeZone(new Date(), timezone);

  return quizLogs.reduce((total, log) => {
    const quizDateKey = getDateKeyInTimeZone(log.createdAt, timezone);
    return quizDateKey === todayKey ? total + 1 : total;
  }, 0);
}

function resolveAgeSegment(birthYear: number | null): AgeSegment {
  const currentYear = new Date().getFullYear();

  if (
    !birthYear ||
    !Number.isInteger(birthYear) ||
    birthYear < 1900 ||
    birthYear > currentYear
  ) {
    return AgeSegment.REMAJA;
  }

  const age = currentYear - birthYear;

  if (age <= 12) {
    return AgeSegment.ANAK;
  }

  if (age <= 17) {
    return AgeSegment.REMAJA;
  }

  if (age <= 24) {
    return AgeSegment.MAHASISWA;
  }

  return AgeSegment.DEWASA_MUDA;
}

function normalizeOptionLabel(option: string): BraveChoiceOptionLabel | null {
  const normalizedOption = option.trim().toUpperCase();

  if (normalizedOption === "A" || normalizedOption === "B") {
    return normalizedOption;
  }

  return null;
}

function normalizeTimezone(timezone?: string) {
  if (!timezone?.trim()) {
    return DEFAULT_TIMEZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
    }).format(new Date());
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
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

export type BraveChoiceStats = {
  correct: number;
  total: number;
  pct: number;
};

export async function getBraveChoiceStatsForUser(
  userId: string,
): Promise<BraveChoiceStats> {
  // Join with QuizQuestion to determine actual correctness via chosenOption vs correctOption.
  // This makes stats immune to reset (which sets isCorrect to false).
  const allLogs = await prisma.quizLog.findMany({
    where: { userId },
    select: {
      chosenOption: true,
      createdAt: true,
      question: {
        select: {
          correctOption: true,
        },
      },
    },
  });

  const enrichedLogs = allLogs.map((log) => ({
    isActuallyCorrect:
      log.chosenOption.toUpperCase() ===
      log.question.correctOption.toUpperCase(),
    createdAt: log.createdAt,
  }));

  const total = enrichedLogs.length;
  const correct = enrichedLogs.filter((log) => log.isActuallyCorrect).length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return {
    correct,
    total,
    pct,
  };
}
