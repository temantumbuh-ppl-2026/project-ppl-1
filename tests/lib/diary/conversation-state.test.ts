import { describe, expect, it } from "vitest";

import {
  ConversationState,
  DiaryTopic,
  RiskLevel,
} from "@/app/generated/prisma/client";
import { resolveConversationState } from "@/lib/diary/conversation-state";

const base = {
  previous: ConversationState.EXPLORATION,
  proposed: ConversationState.CLARIFICATION,
  previousTopics: [DiaryTopic.KELUARGA],
  nextTopics: [DiaryTopic.KELUARGA],
  userMessage: "Aku kesal karena bertengkar dengan ibu.",
  hasSummary: false,
  riskLevel: RiskLevel.NONE,
};

describe("diary conversation state", () => {
  it("menahan refleksi sampai ada cerita yang dapat dirangkum", () => {
    expect(
      resolveConversationState({
        ...base,
        proposed: ConversationState.REFLECTION,
      }),
    ).toBe(ConversationState.CLARIFICATION);

    expect(
      resolveConversationState({
        ...base,
        previous: ConversationState.CLARIFICATION,
        proposed: ConversationState.REFLECTION,
        hasSummary: true,
      }),
    ).toBe(ConversationState.REFLECTION);
  });

  it("hanya masuk tindakan setelah refleksi dan permintaan solusi yang jelas", () => {
    const ready = {
      ...base,
      previous: ConversationState.REFLECTION,
      proposed: ConversationState.ACTION,
      hasSummary: true,
    };

    expect(resolveConversationState(ready)).toBe(ConversationState.REFLECTION);
    expect(
      resolveConversationState({
        ...ready,
        userMessage: "Aku ingin bahas pilihan yang bisa kulakukan.",
      }),
    ).toBe(ConversationState.ACTION);
    expect(
      resolveConversationState({
        ...ready,
        userMessage: "Aku tidak mau saran, cuma ingin didengar.",
      }),
    ).toBe(ConversationState.REFLECTION);
    expect(
      resolveConversationState({
        ...ready,
        userMessage: "Aku ingin saran langkah berikutnya.",
        riskLevel: RiskLevel.HIGH,
      }),
    ).toBe(ConversationState.REFLECTION);
  });

  it("penutupan membutuhkan maksud pengguna dan sesi dapat dibuka lagi", () => {
    const proposedClosing = {
      ...base,
      previous: ConversationState.REFLECTION,
      proposed: ConversationState.CLOSING,
      hasSummary: true,
    };
    expect(resolveConversationState(proposedClosing)).toBe(
      ConversationState.REFLECTION,
    );
    expect(
      resolveConversationState({
        ...proposedClosing,
        userMessage: "Cukup sampai sini dulu, terima kasih.",
      }),
    ).toBe(ConversationState.CLOSING);
    expect(
      resolveConversationState({
        ...base,
        previous: ConversationState.CLOSING,
      }),
    ).toBe(ConversationState.EXPLORATION);
  });

  it("topik baru memulai eksplorasi dan sapaan mood tidak melewati tahap awal", () => {
    expect(
      resolveConversationState({
        ...base,
        previous: ConversationState.REFLECTION,
        nextTopics: [DiaryTopic.AKADEMIK_SEKOLAH],
        hasSummary: true,
      }),
    ).toBe(ConversationState.EXPLORATION);

    expect(
      resolveConversationState({
        ...base,
        proposed: ConversationState.ACTION,
        isMoodGreeting: true,
      }),
    ).toBe(ConversationState.EXPLORATION);
  });
});
