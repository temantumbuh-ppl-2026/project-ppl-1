import { describe, expect, it } from "vitest";

import {
  DiaryStructuredOutputError,
  parseDiaryStructuredOutput,
} from "@/lib/diary/structured-output";

const validOutput = {
  reply:
    "  Kedengarannya berat. Bagian mana yang paling ingin kamu ceritakan?  ",
  topics: ["KELUARGA", "AKADEMIK_SEKOLAH"],
  conversationState: "EXPLORATION",
  proactiveSuggestion: null,
  safety: {
    flag: false,
    riskLevel: "NONE",
    category: null,
    summary: null,
  },
};

describe("diary structured output validation", () => {
  it("menerima beberapa topik dan membersihkan spasi balasan", () => {
    expect(parseDiaryStructuredOutput(JSON.stringify(validOutput))).toEqual({
      ...validOutput,
      reply: validOutput.reply.trim(),
    });
  });

  it("menerima topik kosong sebelum ada konteks dan risiko HIGH yang lengkap", () => {
    const output = {
      ...validOutput,
      topics: [],
      safety: {
        flag: true,
        riskLevel: "HIGH",
        category: "SELF_HARM",
        summary: "Pengguna menyebut niat menyakiti diri.",
      },
    };

    expect(parseDiaryStructuredOutput(JSON.stringify(output)).safety).toEqual(
      output.safety,
    );
  });

  it.each([
    { ...validOutput, topics: ["KELUARGA", "KELUARGA"] },
    { ...validOutput, topics: ["LAINNYA", "PERTEMANAN"] },
    { ...validOutput, topics: ["TIDAK_ADA"] },
    { ...validOutput, reply: "  " },
    { ...validOutput, extra: "unexpected" },
    { ...validOutput, proactiveSuggestion: "  " },
    { ...validOutput, safety: { ...validOutput.safety, flag: true } },
    {
      ...validOutput,
      safety: { ...validOutput.safety, riskLevel: "HIGH" },
    },
    {
      ...validOutput,
      safety: {
        flag: true,
        riskLevel: "ATTENTION",
        category: "SEVERE_DISTRESS",
        summary: null,
      },
    },
  ])("menolak metadata yang tidak konsisten", (output) => {
    expect(() => parseDiaryStructuredOutput(JSON.stringify(output))).toThrow(
      DiaryStructuredOutputError,
    );
  });

  it("menolak JSON rusak tanpa membocorkan isinya dalam error", () => {
    expect(() => parseDiaryStructuredOutput("{pesan pribadi")).toThrow(
      "AI menghasilkan format balasan yang tidak valid.",
    );
  });
});
