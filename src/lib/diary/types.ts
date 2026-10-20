import type {
  ConversationState,
  DiaryTopic,
  RiskLevel,
} from "@/app/generated/prisma/client";

export type DiaryMoodScore = 1 | 2 | 3 | 4 | 5;

export type DiaryEntryDto = {
  id: string;
  date: string;
  dateLabel: string;
  preview: string;
  mood: DiaryMoodScore;
  isToday: boolean;
};

export type DiaryMessageDto = {
  id: string;
  role: "ai" | "user";
  text: string;
  time: string;
};

export type DiaryConversationDto = {
  topics: DiaryTopic[];
  conversationState: ConversationState;
  proactiveSuggestion: string | null;
  actionOptions?: string[];
  safetyFlag: boolean;
  riskLevel: RiskLevel;
};
