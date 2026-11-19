// ============================================================
//  src/features/diary/types/index.ts
//  Semua type untuk fitur diary — sesuaikan shape-nya dengan
//  response API saat backend sudah siap
// ============================================================

export type PlanType = "free" | "premium";

export type UserProfile = {
  id: string;
  name: string;
  plan: PlanType;
  /** Jumlah sesi diary yang sudah dipakai bulan ini */
  diarySessionsUsedThisMonth: number;
  /** Jumlah quiz yang sudah dipakai hari ini */
  quizUsedToday: number;
  streakDays: number;
  totalEntries: number;
  avatarInitials?: string;
};

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type DiaryEntry = {
  id: string;
  date: string; // "YYYY-MM-DD"
  dateLabel: string; // "Senin, 13 Apr 2026"
  preview: string;
  mood: MoodScore;
  isToday?: boolean;
};

export type ChatMessage = {
  id?: string;
  role: "ai" | "user";
  text: string;
  time: string; // "HH.mm"
};

export type QuizOption = {
  label: string; // "A" | "B"
  text: string;
  isBrave: boolean;
};

export type BraveChoiceQuiz = {
  id: string;
  scenario: string;
  options: QuizOption[];
  explanationWrong: string;
  explanationRight: string;
};

export type PlanConfig = {
  diaryPerMonth: number; // Infinity = unlimited
  quizPerDay: number; // Infinity = unlimited
};
