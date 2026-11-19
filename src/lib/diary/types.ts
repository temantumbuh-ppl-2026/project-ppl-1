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
