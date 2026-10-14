import { describe, expect, it } from "vitest";

import { ConversationState, DiaryTopic } from "@/app/generated/prisma/client";
import {
  buildDiaryPromptMessages,
  buildDiaryMoodGreetingPromptMessages,
  buildDiaryStructuredPromptMessages,
} from "@/lib/diary/prompt";

describe("lib/diary/prompt", () => {
  it("membangun system prompt, context, dan riwayat percakapan", () => {
    const messages = buildDiaryPromptMessages({
      userName: "Ruri",
      todayLabel: "Sabtu, 23 Mei 2026",
      conversation: [
        { role: "user", content: "Aku lagi senang hari ini." },
        { role: "assistant", content: "Senang dengarnya." },
      ],
    });

    expect(messages[0]?.role).toBe("system");
    expect(messages[0]?.content).toContain("TemanTumbuh");
    expect(messages[1]?.content).toContain("Nama pengguna: Ruri");
    expect(messages[1]?.content).toContain("Sabtu, 23 Mei 2026");
    expect(messages.at(-2)).toEqual({
      role: "user",
      content: "Aku lagi senang hari ini.",
    });
    expect(messages.at(-1)).toEqual({
      role: "assistant",
      content: "Senang dengarnya.",
    });
  });

  it("fallback ke nama Teman, membatasi 24 turn terakhir, dan memotong konten panjang", () => {
    const longContent = "a".repeat(1300);
    const conversation = Array.from({ length: 26 }, (_, index) => ({
      role: index % 2 === 0 ? ("user" as const) : ("assistant" as const),
      content: index === 25 ? longContent : `pesan-${index}`,
    }));

    const messages = buildDiaryPromptMessages({
      userName: "",
      todayLabel: "Hari ini",
      conversation,
    });

    expect(messages[1]?.content).toContain("Nama pengguna: Teman");
    expect(messages).toHaveLength(26);
    expect(messages[2]?.content).toBe("pesan-2");
    expect(messages.at(-1)?.content).toHaveLength(1203);
    expect(messages.at(-1)?.content.endsWith("...")).toBe(true);
  });

  it("memberi aturan JSON, multi-topic terkini, dan konteks sesi sebelumnya", () => {
    const messages = buildDiaryStructuredPromptMessages({
      userName: "Ruri",
      todayLabel: "Hari ini",
      conversation: [{ role: "user", content: "Aku juga sulit belajar." }],
      currentTopics: [DiaryTopic.KELUARGA],
      currentState: ConversationState.EXPLORATION,
    });

    expect(messages[1]?.role).toBe("system");
    expect(messages[1]?.content).toContain("satu objek JSON");
    expect(messages[1]?.content).toContain("hapus topik lama");
    expect(messages[1]?.content).toContain("KELUARGA");
    expect(messages[1]?.content).toContain("EXPLORATION");
    expect(messages.at(-1)?.content).toBe("Aku juga sulit belajar.");
  });

  it("memberi panduan lanjutan yang menanggapi jawaban tanpa pertanyaan berulang", () => {
    const messages = buildDiaryStructuredPromptMessages({
      userName: "Ruri",
      todayLabel: "Hari ini",
      currentTopics: [DiaryTopic.PERTEMANAN],
      currentState: ConversationState.CLARIFICATION,
      conversation: [
        { role: "assistant", content: "Apa yang membuatmu merasa dijauhi?" },
        { role: "user", content: "Mereka membuat grup tanpa aku." },
      ],
    });

    expect(messages[1]?.content).toContain("Jangan mengulang pertanyaan");
    expect(messages[1]?.content).toContain("Tanggapi jawaban pengguna");
    expect(messages.at(-2)?.content).toContain("Apa yang membuatmu");
    expect(messages.at(-1)?.content).toContain("Mereka membuat grup");
  });

  it("mood greeting memakai output terstruktur dan catatan sebagai pesan pengguna", () => {
    const messages = buildDiaryMoodGreetingPromptMessages({
      userName: "Ruri",
      todayLabel: "Hari ini",
      currentTopics: [],
      currentState: ConversationState.EXPLORATION,
      moodDescription: "sedih",
      note: "Capek belajar",
    });

    expect(messages[1]?.content).toContain("satu objek JSON");
    expect(messages[2]?.content).toContain("sapaan pertama");
    expect(messages.at(-1)).toEqual({
      role: "user",
      content: "Perasaanku hari ini: sedih. Catatan moodku: Capek belajar",
    });
  });
});
