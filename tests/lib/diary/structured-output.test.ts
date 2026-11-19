import { describe, expect, it } from "vitest";

import {
  DiaryStructuredOutputError,
  parseDiaryStructuredOutput,
} from "@/lib/diary/structured-output";
import { applyDiaryResponseGuardrails } from "@/lib/diary/response-guardrails";
import { RiskLevel, SafetyCategory } from "@/app/generated/prisma/client";

const validOutput = {
  reply:
    "  Kedengarannya berat. Bagian mana yang paling ingin kamu ceritakan?  ",
  topics: ["KELUARGA", "AKADEMIK_SEKOLAH"],
  conversationState: "EXPLORATION",
  conversationSummary: null,
  proactiveSuggestion: null,
  actionOptions: [],
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

  it("membersihkan output AI ketika sanitize aktif (markdown fence, extra properties, casing topik, dan safety)", () => {
    const rawAiOutput =
      "```json\n" +
      JSON.stringify({
        reply: "Aku mendengarkanmu.",
        topics: ["perasaan", "akademik_sekolah", "KELUARGA", "KELUARGA"],
        conversationState: "exploration",
        conversationSummary: "  Aku punya tugas sekolah yang membuatku cemas. ",
        proactiveSuggestion: "",
        actionOptions: [],
        safety: {
          flag: false,
          riskLevel: "NONE",
          category: null,
          summary: null,
        },
        thought: "Pengguna bercerita tentang sekolah",
      }) +
      "\n```";

    const parsed = parseDiaryStructuredOutput(rawAiOutput, { sanitize: true });

    expect(parsed.reply).toBe("Aku mendengarkanmu.");
    expect(parsed.topics).toEqual(["AKADEMIK_SEKOLAH", "KELUARGA"]);
    expect(parsed.conversationState).toBe("EXPLORATION");
    expect(parsed.conversationSummary).toBe(
      "Aku punya tugas sekolah yang membuatku cemas.",
    );
    expect(parsed.proactiveSuggestion).toBeNull();
    expect(parsed.safety).toEqual({
      flag: false,
      riskLevel: "NONE",
      category: null,
      summary: null,
    });
  });

  it("menolak tingkat risiko yang tidak dikenal walau sanitize aktif", () => {
    expect(() =>
      parseDiaryStructuredOutput(
        JSON.stringify({
          ...validOutput,
          safety: {
            flag: false,
            riskLevel: "UNKNOWN",
            category: null,
            summary: null,
          },
        }),
        { sanitize: true },
      ),
    ).toThrow(DiaryStructuredOutputError);
  });

  it("mengarahkan permintaan kode kembali ke cerita dan menghapus em dash", () => {
    const parsed = parseDiaryStructuredOutput(JSON.stringify(validOutput));
    const redirected = applyDiaryResponseGuardrails(
      { ...parsed, reply: "Ini kodenya: ```ts\\nconst x = 1;```" },
      "Tolong buatkan kode untuk tugas sekolah.",
    );
    expect(redirected.reply).toContain("nemenin kamu cerita");
    expect(redirected.reply).not.toContain("const x");

    expect(
      applyDiaryResponseGuardrails(
        { ...parsed, reply: "Aku paham\u2014mau cerita lebih jauh?" },
        "Aku stres karena tugas sekolah.",
      ).reply,
    ).toBe("Aku paham, mau cerita lebih jauh?");
  });

  it.each([
    {
      flag: false,
      riskLevel: "HIGH",
      category: "SELF_HARM",
      summary: "Ada ancaman saat ini.",
    },
    {
      flag: true,
      riskLevel: "HIGH",
      category: null,
      summary: "Ada ancaman saat ini.",
    },
    {
      flag: true,
      riskLevel: "HIGH",
      category: "BOGUS",
      summary: "Ada ancaman saat ini.",
    },
    { flag: true, riskLevel: "HIGH", category: "SELF_HARM", summary: " " },
    { flag: true, riskLevel: "HIGH", category: "SELF_HARM" },
    { flag: true, riskLevel: "NONE", category: null, summary: null },
    {
      flag: false,
      riskLevel: "NONE",
      category: null,
      summary: "Ada ancaman yang sedang berlangsung.",
    },
  ])(
    "sanitize tidak mengarang metadata keselamatan agar lolos validasi",
    (safety) => {
      expect(() =>
        parseDiaryStructuredOutput(JSON.stringify({ ...validOutput, safety }), {
          sanitize: true,
        }),
      ).toThrow(DiaryStructuredOutputError);
    },
  );

  it("menormalisasi casing safety yang lengkap tanpa mengganti isinya", () => {
    const parsed = parseDiaryStructuredOutput(
      JSON.stringify({
        ...validOutput,
        safety: {
          flag: true,
          riskLevel: " attention ",
          category: " severe_distress ",
          summary: "  Keselamatan saat ini perlu diperjelas.  ",
        },
      }),
      { sanitize: true },
    );
    expect(parsed.safety).toEqual({
      flag: true,
      riskLevel: "ATTENTION",
      category: "SEVERE_DISTRESS",
      summary: "Keselamatan saat ini perlu diperjelas.",
    });
  });

  it.each(Object.values(SafetyCategory))(
    "HIGH memakai respons terkontrol untuk %s",
    (category) => {
      const parsed = parseDiaryStructuredOutput(
        JSON.stringify({
          ...validOutput,
          reply: "Balasan model yang tidak layak ditampilkan.",
          proactiveSuggestion: "Buat rencana liburan.",
          actionOptions: ["Atur kegiatan keluarga.", "Buat daftar belanja."],
          safety: {
            flag: true,
            riskLevel: "HIGH",
            category,
            summary: "Ada indikasi bahaya aktif.",
          },
        }),
      );
      const guarded = applyDiaryResponseGuardrails(
        parsed,
        "Aku sedang tidak aman.",
      );
      expect(guarded.reply).not.toBe(parsed.reply);
      expect(guarded.reply).toContain("darurat setempat");
      expect(guarded.reply).toContain("aman");
      expect(guarded.reply).not.toMatch(
        /orang tua|\u2014|sudah menghubungi admin/,
      );
      expect(guarded.proactiveSuggestion).toBeNull();
      expect(guarded.actionOptions).toEqual([]);
      expect(guarded.safety).toEqual(parsed.safety);
    },
  );

  it("ATTENTION mempertahankan balasan kontekstual dan menghapus saran", () => {
    const parsed = parseDiaryStructuredOutput(
      JSON.stringify({
        ...validOutput,
        reply:
          "Kamu menyebut ancaman di sekolah. Sekarang kamu berada di tempat yang aman?",
        proactiveSuggestion: "Tulis rencana.",
        actionOptions: ["Tulis rencana.", "Buat jadwal."],
        safety: {
          flag: true,
          riskLevel: "ATTENTION",
          category: "BULLYING_THREAT",
          summary: "Waktu ancaman dan keselamatan saat ini belum jelas.",
        },
      }),
    );
    const guarded = applyDiaryResponseGuardrails(
      parsed,
      "Aku takut ancaman di sekolah.",
    );
    expect(guarded.reply).toBe(parsed.reply);
    expect(guarded.safety.riskLevel).toBe(RiskLevel.ATTENTION);
    expect(guarded.proactiveSuggestion).toBeNull();
    expect(guarded.actionOptions).toEqual([]);
  });

  it.each([
    "Kamu pasti mengalami depresi klinis.",
    "Kamu memang lebay.",
    "Ini semua salahmu.",
    "Saya adalah psikolog yang menangani kondisimu.",
    "Sebaiknya kamu menyakiti diri.",
    "Coba lakukan hal itu untuk melukai diri.",
    "Aku sudah menghubungi admin untukmu.",
  ])(
    "mengganti respons yang melanggar batas tanpa mengubah risiko: %s",
    (reply) => {
      const parsed = parseDiaryStructuredOutput(
        JSON.stringify({ ...validOutput, reply }),
      );
      const guarded = applyDiaryResponseGuardrails(parsed, "Aku ingin cerita.");
      expect(guarded.reply).not.toBe(reply);
      expect(guarded.safety.riskLevel).toBe(RiskLevel.NONE);
      expect(guarded.actionOptions).toEqual([]);
    },
  );

  it("menyaring saran berbahaya meskipun reply terlihat aman", () => {
    const parsed = parseDiaryStructuredOutput(
      JSON.stringify({
        ...validOutput,
        reply: "Kita bisa membahas langkah kecil.",
        actionOptions: ["Sebaiknya kamu menyakiti diri.", "Tulis ceritamu."],
      }),
    );
    expect(
      applyDiaryResponseGuardrails(parsed, "Aku mau membahas langkah.")
        .actionOptions,
    ).toEqual([]);
  });

  it.each([
    "Kamu tidak lemah karena meminta bantuan.",
    "Aku bukan psikolog dan tidak bisa memberi diagnosis.",
    "Kita bisa mulai dengan menanyakan waktu makan bersama yang cocok untuk keluarga.",
  ])("tetap menerima percakapan suportif dan rencana pribadi: %s", (reply) => {
    const parsed = parseDiaryStructuredOutput(
      JSON.stringify({ ...validOutput, reply }),
    );
    expect(
      applyDiaryResponseGuardrails(parsed, "Aku ingin bercerita.").reply,
    ).toBe(reply);
  });
});
