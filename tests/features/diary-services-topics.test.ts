import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getDiaryMessages,
  sendChatMessageStream,
} from "@/features/diary/services/diaryServices";
import type { DiaryConversation } from "@/features/diary/types";
import {
  diaryStructuredOutputSchema,
  type DiaryStructuredOutput,
} from "@/lib/diary/structured-output";

const structuredOutput = {
  reply: "Aku dengar.",
  topics: ["PERTEMANAN", "AKADEMIK_SEKOLAH"],
  conversationState: "REFLECTION",
  proactiveSuggestion: null,
  safety: { flag: false, riskLevel: "NONE", category: null, summary: null },
} satisfies DiaryStructuredOutput;

const conversation = {
  topics: structuredOutput.topics,
  conversationState: structuredOutput.conversationState,
  proactiveSuggestion: structuredOutput.proactiveSuggestion,
  safetyFlag: structuredOutput.safety.flag,
  riskLevel: structuredOutput.safety.riskLevel,
} satisfies DiaryConversation;

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
            conversation,
          },
        }),
      }),
    );

    const result = await getDiaryMessages("today");

    expect(result.conversation).toEqual(conversation);
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
      conversation,
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
    expect(result.conversation).toEqual(conversation);
  });

  it("memakai mock structured output yang valid terhadap schema BE-03", () => {
    expect(diaryStructuredOutputSchema.parse(structuredOutput)).toEqual(
      structuredOutput,
    );
  });

  it("tidak menerima metadata percakapan yang tidak mengikuti kontrak API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            messages: [],
            conversation: { ...conversation, conversationState: "UNKNOWN" },
          },
        }),
      }),
    );
    await expect(getDiaryMessages("today")).rejects.toThrow(
      "Topik percakapan diary tidak valid.",
    );
  });
});
