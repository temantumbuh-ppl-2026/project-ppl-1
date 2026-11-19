import { describe, expect, it } from "vitest";

import { buildDiaryPromptMessages } from "@/lib/diary/prompt";

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
});
