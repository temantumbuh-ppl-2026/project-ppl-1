import { describe, expect, it } from "vitest";

import { resolveConversationSummary } from "@/lib/diary/conversation-summary";

describe("diary conversation summary", () => {
  const userMessages = [
    "Aku bertengkar dengan ibu setelah pulang sekolah.",
    "Besok ada ulangan matematika dan aku belum siap.",
  ];

  it("menyimpan potongan yang berasal dari pesan pengguna", () => {
    expect(
      resolveConversationSummary({
        proposed:
          "Aku bertengkar dengan ibu\nBesok ada ulangan matematika dan aku belum siap.",
        previous: null,
        userMessages,
      }),
    ).toBe(
      "Aku bertengkar dengan ibu\nBesok ada ulangan matematika dan aku belum siap.",
    );
  });

  it("tidak mengganti konteks lama dengan dugaan yang tidak diucapkan pengguna", () => {
    expect(
      resolveConversationSummary({
        proposed: "Aku mengalami depresi karena ibu membenciku.",
        previous: "Aku bertengkar dengan ibu",
        userMessages,
      }),
    ).toBe("Aku bertengkar dengan ibu");
  });

  it("tidak mengambil klaim dari balasan AI atau membuat rangkuman dari cerita kosong", () => {
    expect(
      resolveConversationSummary({
        proposed: "Kamu pasti merasa ditinggalkan semua orang.",
        previous: null,
        userMessages: ["Aku ingin cerita."],
      }),
    ).toBeNull();
    expect(
      resolveConversationSummary({
        proposed: null,
        previous: null,
        userMessages: [],
      }),
    ).toBeNull();
  });
});
