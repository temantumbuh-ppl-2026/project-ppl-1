export type MoodDay = {
  day: string;
  date: number;
  month: string;
  score: number | null;
  note?: string | null;
  today?: boolean;
  fullDate?: Date;
};

export type WeekData = {
  id: string;
  label: string;
  shortLabel: string;
  monthYearLabel: string;
  weekOfMonth: number;
  year: number;
  monthIndex: number;
  monthName: string;
  days: MoodDay[];
};

export type MoodLog = {
  id: string;
  moodScore: number;
  note?: string | null;
  createdAt: string;
};

export type BaselineResponse = {
  id: string;
  userId: string;
  isBeginner: boolean;
  label: "Beginner" | "Intermediate";
  confidenceScore: number | null;
  analyzedAt: string;
} | null;

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  isPremium?: boolean;
  currentStreak?: number;
  parentEmail?: string | null;
};

export type ParentStatusResponse = {
  email: string | null;
  status: "pending" | "verified" | "expired" | null;
  expiresAt: string | null;
  reason: "rejected" | "expired" | null;
  lastSentAt: string | null;
  lastReportType: "free_summary" | "premium_pdf" | null;
  lastReportStatus: "sent" | "failed" | null;
} | null;
