import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getDiaryMessages,
  sendChatMessageStream,
} from "@/features/diary/services/diaryServices";

describe("diary frontend service metadata", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("membaca beberapa topik dari endpoint pesan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            messages: [],
            conversation: { topics: ["KELUARGA", "PERTEMANAN"] },
          },
        }),
      }),
    );

    const result = await getDiaryMessages("today");

    expect(result.conversation?.topics).toEqual(["KELUARGA", "PERTEMANAN"]);
  });

  it("membaca topik terbaru dari event done chat stream", async () => {
    const done = {
      aiMessage: { id: "ai-1", role: "ai", text: "Aku dengar.", time: "10.00" },
      entry: {
        id: "diary-1",
        date: "2026-10-14",
        dateLabel: "Hari ini",
        preview: "Cerita",
        mood: 3,
        isToday: true,
      },
      diarySessionsUsedThisMonth: 1,
      conversation: { topics: ["PERTEMANAN", "AKADEMIK_SEKOLAH"] },
    };
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `event: done\ndata: ${JSON.stringify(done)}\n\n`,
          ),
        );
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, body: stream }),
    );

    const result = await sendChatMessageStream("today", "Aku ingin cerita.");

    expect(result.conversation?.topics).toEqual([
      "PERTEMANAN",
      "AKADEMIK_SEKOLAH",
    ]);
  });
});
