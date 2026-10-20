import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockTx } = vi.hoisted(() => {
  const tx = {
    $queryRaw: vi.fn(),
    diary: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    diaryMessage: {
      count: vi.fn(),
      create: vi.fn(),
    },
    safetyAlert: {
      create: vi.fn(),
    },
  };

  return {
    mockTx: tx,
    mockPrisma: {
      $transaction: vi.fn(),
      user: {
        findUnique: vi.fn(),
      },
      diary: {
        count: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      diaryMessage: {
        count: vi.fn(),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

const mockGenerateDiaryAssistantReply = vi.hoisted(() => vi.fn());
const mockGenerateDiaryStructuredReply = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("@/lib/encryption", () => ({
  EncryptionError: class EncryptionError extends Error {},
  encrypt: vi.fn((value: string) => `encrypted:${value}`),
  decrypt: vi.fn((value: string) => value.replace(/^encrypted:/, "")),
}));

vi.mock("@/lib/diary/litellm", () => ({
  generateDiaryAssistantReply: mockGenerateDiaryAssistantReply,
  generateDiaryStructuredReply: mockGenerateDiaryStructuredReply,
}));

import {
  ConversationState,
  DiaryTopic,
  RiskLevel,
  Sender,
} from "@/app/generated/prisma/client";
import { DiaryStructuredOutputError } from "@/lib/diary/structured-output";
import type { DiaryStructuredOutput } from "@/lib/diary/structured-output";
import { diaryConversationStarters } from "@/lib/diary/starters";
import {
  DiaryServiceError,
  ensureDiaryShellFromMood,
  generateDiaryGreetingFromMood,
  getDiaryConversationMetadata,
  getTotalDiaryCount,
  initiateDiaryFromMood,
  listDiaryEntriesByMonth,
  listDiaryMessagesByEntryId,
  persistDiaryChatSession,
  prepareDiaryChatSession,
  sendDiaryChatMessage,
  sendDiaryStructuredChatMessage,
  toDiaryServiceErrorForAiFailure,
  type PreparedDiaryChatSession,
} from "@/lib/diary/service";

const today = new Date("2026-05-23T03:00:00.000Z");
const todayDate = new Date(Date.UTC(2026, 4, 23));
const structuredOutput: DiaryStructuredOutput = {
  reply: "Aku mendengarmu. Apa yang paling berat sekarang?",
  topics: [DiaryTopic.KELUARGA, DiaryTopic.AKADEMIK_SEKOLAH],
  conversationState: ConversationState.CLARIFICATION,
  conversationSummary: null,
  proactiveSuggestion: "Coba ceritakan satu kejadian yang paling mengganggu.",
  actionOptions: [],
  safety: {
    flag: false,
    riskLevel: RiskLevel.NONE,
    category: null,
    summary: null,
  },
};

function createSession(
  overrides: Partial<PreparedDiaryChatSession> = {},
): PreparedDiaryChatSession {
  return {
    userId: "user-1",
    timezone: "Asia/Jakarta",
    diary: null,
    todayKey: "2026-05-23",
    todayDate,
    trimmedText: "Aku ingin cerita",
    promptHistory: [],
    promptMessages: [{ role: "user", content: "Aku ingin cerita" }],
    structuredPromptMessages: [{ role: "user", content: "Aku ingin cerita" }],
    ...overrides,
  };
}

describe("lib/diary/service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(today);
    mockPrisma.$transaction.mockImplementation((arg: unknown) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg);
      }

      if (typeof arg === "function") {
        return arg(mockTx);
      }

      return Promise.resolve(arg);
    });
    mockTx.$queryRaw.mockResolvedValue([{ riskLevel: RiskLevel.NONE }]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mengambil total diary aktif user", async () => {
    mockPrisma.diary.count.mockResolvedValue(7);

    await expect(getTotalDiaryCount("user-1")).resolves.toBe(7);
    expect(mockPrisma.diary.count).toHaveBeenCalledWith({
      where: { userId: "user-1", isActive: true },
    });
  });

  it("listDiaryEntriesByMonth membuat virtual entry hari ini jika bulan berjalan belum punya entry", async () => {
    mockPrisma.diary.findMany.mockResolvedValue([]);
    mockPrisma.diary.count.mockResolvedValue(0);

    const result = await listDiaryEntriesByMonth({
      userId: "user-1",
      monthKey: "2026-05",
      timezone: "Asia/Jakarta",
    });

    expect(result.diarySessionsUsedThisMonth).toBe(0);
    expect(result.entries[0]).toEqual(
      expect.objectContaining({
        id: "today",
        date: "2026-05-23",
        isToday: true,
        mood: 3,
      }),
    );
  });

  it("listDiaryEntriesByMonth decrypt, sort, preview, dan estimasi mood", async () => {
    mockPrisma.diary.findMany.mockResolvedValue([
      {
        id: "diary-1",
        date: new Date("2026-05-20T00:00:00.000Z"),
        messages: [
          {
            id: "m-ai",
            senderType: Sender.AI,
            content: "encrypted:Hai",
            createdAt: new Date("2026-05-20T01:00:00.000Z"),
          },
          {
            id: "m-user",
            senderType: Sender.USER,
            content: "encrypted:Aku senang dan bangga hari ini",
            createdAt: new Date("2026-05-20T02:00:00.000Z"),
          },
        ],
      },
    ]);
    mockPrisma.diary.count.mockResolvedValue(1);

    const result = await listDiaryEntriesByMonth({
      userId: "user-1",
      monthKey: "2026-05",
    });

    expect(result.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "diary-1",
          preview: "Aku senang dan bangga hari ini",
          mood: 5,
          isToday: false,
        }),
      ]),
    );
  });

  it("listDiaryEntriesByMonth menolak month tidak valid", async () => {
    await expect(
      listDiaryEntriesByMonth({ userId: "user-1", monthKey: "2026-99" }),
    ).rejects.toMatchObject({ code: "INVALID_MONTH", status: 400 });
  });

  it("listDiaryMessagesByEntryId return kosong jika diary tidak ditemukan", async () => {
    mockPrisma.diary.findFirst.mockResolvedValue(null);

    await expect(
      listDiaryMessagesByEntryId({ userId: "user-1", entryId: "missing" }),
    ).resolves.toEqual([]);
  });

  it("listDiaryMessagesByEntryId mengembalikan pesan terurut dan decrypted", async () => {
    mockPrisma.diary.findFirst.mockResolvedValue({
      id: "diary-1",
      date: todayDate,
    });
    mockPrisma.diaryMessage.findMany.mockResolvedValue([
      {
        id: "m1",
        senderType: Sender.USER,
        content: "encrypted:Halo",
        createdAt: new Date("2026-05-23T02:00:00.000Z"),
      },
      {
        id: "m2",
        senderType: Sender.AI,
        content: "encrypted:Hai juga",
        createdAt: new Date("2026-05-23T02:01:00.000Z"),
      },
    ]);

    const messages = await listDiaryMessagesByEntryId({
      userId: "user-1",
      entryId: "diary-1",
      timezone: "Asia/Jakarta",
    });

    expect(messages).toEqual([
      expect.objectContaining({ id: "m1", role: "user", text: "Halo" }),
      expect.objectContaining({ id: "m2", role: "ai", text: "Hai juga" }),
    ]);
  });

  it("getDiaryConversationMetadata menjaga ownership dan mendekripsi pilihan yang aman", async () => {
    mockPrisma.diary.findFirst.mockResolvedValueOnce(null);
    await expect(
      getDiaryConversationMetadata({
        userId: "user-1",
        entryId: "milik-orang-lain",
      }),
    ).resolves.toBeNull();
    expect(mockPrisma.diary.findUnique).not.toHaveBeenCalled();

    mockPrisma.diary.findFirst.mockResolvedValueOnce({
      id: "diary-1",
      date: todayDate,
    });
    mockPrisma.diary.findUnique.mockResolvedValueOnce({
      topics: [DiaryTopic.KELUARGA, DiaryTopic.AKADEMIK_SEKOLAH],
      conversationState: ConversationState.ACTION,
      actionOptions:
        'encrypted:["Bicara dengan ibu saat tenang.","Tulis dulu yang ingin kusampaikan."]',
      safetyFlag: false,
      riskLevel: RiskLevel.NONE,
    });

    await expect(
      getDiaryConversationMetadata({
        userId: "user-1",
        entryId: "diary-1",
      }),
    ).resolves.toEqual({
      topics: [DiaryTopic.KELUARGA, DiaryTopic.AKADEMIK_SEKOLAH],
      conversationState: ConversationState.ACTION,
      proactiveSuggestion: "Bicara dengan ibu saat tenang.",
      actionOptions: [
        "Bicara dengan ibu saat tenang.",
        "Tulis dulu yang ingin kusampaikan.",
      ],
      safetyFlag: false,
      riskLevel: RiskLevel.NONE,
    });
  });

  it("prepareDiaryChatSession validasi pesan kosong dan user tidak ditemukan", async () => {
    await expect(
      prepareDiaryChatSession({
        userId: "user-1",
        entryId: "today",
        messageText: "   ",
      }),
    ).rejects.toMatchObject({ code: "EMPTY_MESSAGE" });

    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      prepareDiaryChatSession({
        userId: "user-1",
        entryId: "today",
        messageText: "Halo",
      }),
    ).rejects.toMatchObject({ code: "USER_NOT_FOUND", status: 404 });
  });

  it("prepareDiaryChatSession menolak entry lampau dan quota gratis habis", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: false,
    });
    mockPrisma.diary.findFirst.mockResolvedValueOnce({
      id: "old-diary",
      date: new Date("2026-05-01T00:00:00.000Z"),
    });

    await expect(
      prepareDiaryChatSession({
        userId: "user-1",
        entryId: "old-diary",
        messageText: "Halo",
      }),
    ).rejects.toMatchObject({ code: "READ_ONLY_ENTRY", status: 403 });

    mockPrisma.diary.findFirst.mockResolvedValueOnce(null);
    mockPrisma.diary.count.mockResolvedValueOnce(15);

    await expect(
      prepareDiaryChatSession({
        userId: "user-1",
        entryId: "today",
        messageText: "Halo",
      }),
    ).rejects.toMatchObject({ code: "DIARY_QUOTA_EXCEEDED", status: 403 });
  });

  it("prepareDiaryChatSession menolak entry eksplisit yang tidak dimiliki tanpa membuat diary", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst.mockResolvedValue(null);

    await expect(
      prepareDiaryChatSession({
        userId: "user-1",
        entryId: "diary-user-lain",
        messageText: "Halo",
      }),
    ).rejects.toMatchObject({ code: "SESSION_NOT_FOUND", status: 404 });
    expect(mockPrisma.diary.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "diary-user-lain",
          userId: "user-1",
        }),
      }),
    );
    expect(mockPrisma.diary.create).not.toHaveBeenCalled();
    expect(mockGenerateDiaryAssistantReply).not.toHaveBeenCalled();
  });

  it("prepareDiaryChatSession membuat prompt dari histori decrypted dan pesan masuk", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst.mockResolvedValue({
      id: "diary-1",
      date: todayDate,
    });
    mockPrisma.diaryMessage.findMany.mockResolvedValue([
      {
        id: "m1",
        senderType: Sender.USER,
        content: "encrypted:Aku sedih",
        createdAt: new Date("2026-05-23T01:00:00.000Z"),
      },
    ]);

    const session = await prepareDiaryChatSession({
      userId: "user-1",
      entryId: "today",
      messageText: "  Sekarang lebih tenang  ",
      timezone: "Asia/Jakarta",
    });

    expect(session.trimmedText).toBe("Sekarang lebih tenang");
    expect(session.promptHistory[0]?.content).toBe("Aku sedih");
    expect(session.promptMessages.at(-1)).toEqual({
      role: "user",
      content: "Sekarang lebih tenang",
    });
    expect(mockPrisma.diary.findUnique).not.toHaveBeenCalled();
  });

  it("prepareDiaryChatSession membaca metadata sesi hanya untuk output terstruktur", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst.mockResolvedValue({
      id: "diary-1",
      date: todayDate,
    });
    mockPrisma.diary.findUnique.mockResolvedValue({
      topics: [DiaryTopic.KELUARGA],
      conversationState: ConversationState.REFLECTION,
      conversationSummary: "encrypted:Aku capek karena masalah keluarga.",
      riskLevel: RiskLevel.ATTENTION,
    });
    mockPrisma.diaryMessage.findMany.mockResolvedValue([]);

    const session = await prepareDiaryChatSession(
      {
        userId: "user-1",
        entryId: "today",
        messageText: "Aku juga capek sekolah",
      },
      { includeMetadata: true },
    );

    expect(mockPrisma.diary.findUnique).toHaveBeenCalledWith({
      where: { id: "diary-1" },
      select: {
        topics: true,
        conversationState: true,
        conversationSummary: true,
        actionOptions: true,
        riskLevel: true,
      },
    });
    expect(session.diary?.topics).toEqual([DiaryTopic.KELUARGA]);
    expect(session.structuredPromptMessages[1]?.content).toContain(
      "State sebelum pesan ini: REFLECTION",
    );
    expect(session.structuredPromptMessages[1]?.content).toContain(
      "Aku capek karena masalah keluarga.",
    );
  });

  it("membawa pilihan tindakan tersimpan ke prompt saat pengguna menindaklanjuti", async () => {
    const options = [
      "Ajak keluarga memilih waktu makan bersama.",
      "Mulai dengan bertanya kapan mereka senggang.",
    ];
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst.mockResolvedValue({
      id: "diary-1",
      date: todayDate,
    });
    mockPrisma.diary.findUnique.mockResolvedValue({
      topics: [DiaryTopic.KELUARGA],
      conversationState: ConversationState.ACTION,
      conversationSummary: "encrypted:Kami ingin makan bersama lagi.",
      actionOptions: `encrypted:${JSON.stringify(options)}`,
      riskLevel: RiskLevel.NONE,
    });
    mockPrisma.diaryMessage.findMany.mockResolvedValue([]);

    const session = await prepareDiaryChatSession(
      {
        userId: "user-1",
        entryId: "today",
        messageText: "Aku ingin mencoba pilihan pertama.",
      },
      { includeMetadata: true },
    );

    expect(session.diary?.actionOptions).toEqual(options);
    expect(session.structuredPromptMessages[1]?.content).toContain(
      JSON.stringify(options),
    );
  });

  it("persistDiaryChatSession menolak balasan AI kosong", async () => {
    await expect(
      persistDiaryChatSession({
        session: createSession(),
        assistantText: "   ",
      }),
    ).rejects.toMatchObject({ code: "AI_EMPTY_RESPONSE", status: 502 });
  });

  it("persistDiaryChatSession menolak metadata invalid sebelum transaksi", async () => {
    await expect(
      persistDiaryChatSession({
        session: createSession(),
        assistantText: "Abaikan",
        assistantOutput: {
          ...structuredOutput,
          topics: [DiaryTopic.KELUARGA, DiaryTopic.KELUARGA],
        },
      }),
    ).rejects.toThrow(DiaryStructuredOutputError);
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("persistDiaryChatSession membuat diary baru, menyimpan dua pesan, dan menghitung quota bulan", async () => {
    mockTx.diary.create.mockResolvedValue({
      id: "diary-1",
      date: todayDate,
    });
    mockTx.diaryMessage.create
      .mockResolvedValueOnce({
        id: "user-message",
        senderType: Sender.USER,
        content: "encrypted:Aku ingin cerita",
        createdAt: new Date("2026-05-23T03:01:00.000Z"),
      })
      .mockResolvedValueOnce({
        id: "ai-message",
        senderType: Sender.AI,
        content: "encrypted:Aku dengerin.",
        createdAt: new Date("2026-05-23T03:02:00.000Z"),
      });
    mockTx.diary.count.mockResolvedValue(3);

    const result = await persistDiaryChatSession({
      session: createSession(),
      assistantText: " Aku dengerin. ",
    });

    expect(mockTx.diary.create).toHaveBeenCalled();
    expect(mockTx.diaryMessage.create).toHaveBeenCalledTimes(2);
    expect(result.aiMessage).toEqual(
      expect.objectContaining({ id: "ai-message", role: "ai" }),
    );
    expect(result.entry.preview).toBe("Aku ingin cerita");
    expect(result.diarySessionsUsedThisMonth).toBe(3);
  });

  it("menyimpan output terstruktur dan alert HIGH dalam satu transaksi", async () => {
    mockTx.diary.create.mockResolvedValue({ id: "diary-1", date: todayDate });
    mockTx.diaryMessage.create
      .mockResolvedValueOnce({
        id: "user-message",
        senderType: Sender.USER,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "ai-message",
        senderType: Sender.AI,
        createdAt: today,
      });
    mockTx.diary.count.mockResolvedValue(1);
    const output: DiaryStructuredOutput = {
      ...structuredOutput,
      safety: {
        flag: true,
        riskLevel: RiskLevel.HIGH,
        category: "SELF_HARM",
        summary: "Pengguna menyebut niat menyakiti diri.",
      },
    };

    const result = await persistDiaryChatSession({
      session: createSession(),
      assistantText: output.reply,
      assistantOutput: output,
    });

    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Object),
    );
    expect(mockTx.diary.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        topics: [DiaryTopic.KELUARGA, DiaryTopic.AKADEMIK_SEKOLAH],
        conversationState: ConversationState.CLARIFICATION,
        proactiveSuggestion: null,
        actionOptions: null,
        safetyFlag: true,
        riskLevel: RiskLevel.HIGH,
      }),
      select: { id: true, date: true },
    });
    expect(mockTx.diaryMessage.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          senderType: Sender.AI,
          content: `encrypted:${output.reply}`,
        }),
      }),
    );
    expect(mockTx.safetyAlert.create).toHaveBeenCalledWith({
      data: {
        diaryId: "diary-1",
        triggerMessageId: "user-message",
        riskLevel: RiskLevel.HIGH,
        category: "SELF_HARM",
        summary: "encrypted:Pengguna menyebut niat menyakiti diri.",
      },
    });
    expect(result.conversation).toMatchObject({
      topics: output.topics,
      safetyFlag: true,
      riskLevel: RiskLevel.HIGH,
    });
  });

  it("mengganti topik lama dan mempertahankan risiko tertinggi pada diary existing", async () => {
    mockTx.diary.update.mockResolvedValue({ id: "diary-1", date: todayDate });
    mockTx.diaryMessage.create
      .mockResolvedValueOnce({
        id: "user-message",
        senderType: Sender.USER,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "ai-message",
        senderType: Sender.AI,
        createdAt: today,
      });
    mockTx.diary.count.mockResolvedValue(1);
    const output: DiaryStructuredOutput = {
      ...structuredOutput,
      topics: [DiaryTopic.PERTEMANAN],
      proactiveSuggestion: null,
    };

    await persistDiaryChatSession({
      session: createSession({
        diary: {
          id: "diary-1",
          date: todayDate,
          topics: [DiaryTopic.KELUARGA],
          conversationState: ConversationState.EXPLORATION,
          conversationSummary: null,
          riskLevel: RiskLevel.HIGH,
        },
      }),
      assistantText: output.reply,
      assistantOutput: output,
    });

    expect(mockTx.diary.update).toHaveBeenCalledWith({
      where: { id: "diary-1" },
      data: {
        topics: [DiaryTopic.PERTEMANAN],
        conversationState: ConversationState.EXPLORATION,
        conversationSummary: null,
        proactiveSuggestion: null,
        actionOptions: null,
        safetyFlag: true,
        riskLevel: RiskLevel.HIGH,
      },
      select: { id: true, date: true },
    });
    expect(mockTx.safetyAlert.create).not.toHaveBeenCalled();
  });

  it("menyimpan rangkuman internal terenkripsi bersama state dan pesan", async () => {
    mockTx.diary.update.mockResolvedValue({ id: "diary-1", date: todayDate });
    mockTx.diaryMessage.create
      .mockResolvedValueOnce({
        id: "user-message",
        senderType: Sender.USER,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "ai-message",
        senderType: Sender.AI,
        createdAt: today,
      });
    mockTx.diary.count.mockResolvedValue(1);

    const summary = "Aku bertengkar dengan ibu setelah pulang sekolah.";
    const result = await persistDiaryChatSession({
      session: createSession({
        trimmedText: "Aku bertengkar dengan ibu setelah pulang sekolah.",
        diary: {
          id: "diary-1",
          date: todayDate,
          topics: [DiaryTopic.KELUARGA],
          conversationState: ConversationState.CLARIFICATION,
          conversationSummary: null,
          riskLevel: RiskLevel.NONE,
        },
      }),
      assistantText: structuredOutput.reply,
      assistantOutput: {
        ...structuredOutput,
        topics: [DiaryTopic.KELUARGA],
        conversationState: ConversationState.REFLECTION,
        conversationSummary: summary,
        proactiveSuggestion: null,
      },
    });

    expect(mockTx.diary.update).toHaveBeenCalledWith({
      where: { id: "diary-1" },
      data: expect.objectContaining({
        conversationState: ConversationState.REFLECTION,
        conversationSummary: `encrypted:${summary}`,
      }),
      select: { id: true, date: true },
    });
    expect(result.conversation?.conversationState).toBe(
      ConversationState.REFLECTION,
    );
    expect(result.conversation).not.toHaveProperty("conversationSummary");
  });

  it("menyimpan dua pilihan tindakan terenkripsi ketika pengguna meminta langkah", async () => {
    mockTx.diary.update.mockResolvedValue({ id: "diary-1", date: todayDate });
    mockTx.diaryMessage.create
      .mockResolvedValueOnce({
        id: "user-message",
        senderType: Sender.USER,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "ai-message",
        senderType: Sender.AI,
        createdAt: today,
      });
    mockTx.diary.count.mockResolvedValue(1);

    const actionOptions = [
      "Tulis dulu yang ingin kamu sampaikan ke ibu.",
      "Cari waktu tenang untuk bicara dengan ibu.",
    ];
    const result = await persistDiaryChatSession({
      session: createSession({
        trimmedText: "Aku ingin bahas pilihan langkah yang bisa kulakukan.",
        promptHistory: [
          {
            id: "prior-user-message",
            senderType: Sender.USER,
            content: "Aku bertengkar dengan ibu setelah pulang sekolah.",
            createdAt: today,
          },
        ],
        diary: {
          id: "diary-1",
          date: todayDate,
          topics: [DiaryTopic.KELUARGA],
          conversationState: ConversationState.EXPLORATION,
          conversationSummary:
            "Aku bertengkar dengan ibu setelah pulang sekolah.",
          riskLevel: RiskLevel.NONE,
        },
      }),
      assistantText: structuredOutput.reply,
      assistantOutput: {
        ...structuredOutput,
        topics: [DiaryTopic.KELUARGA],
        conversationState: ConversationState.ACTION,
        proactiveSuggestion: actionOptions[0],
        actionOptions,
      },
    });

    expect(mockTx.diary.update).toHaveBeenCalledWith({
      where: { id: "diary-1" },
      data: expect.objectContaining({
        conversationState: ConversationState.ACTION,
        proactiveSuggestion: `encrypted:${actionOptions[0]}`,
        actionOptions: `encrypted:${JSON.stringify(actionOptions)}`,
      }),
      select: { id: true, date: true },
    });
    expect(result.conversation?.actionOptions).toEqual(actionOptions);
  });

  it("ensureDiaryShellFromMood memakai diary existing atau membuat shell baru", async () => {
    mockPrisma.diary.findFirst.mockResolvedValueOnce({
      id: "existing",
      messages: [{ id: "m1" }],
    });

    await expect(
      ensureDiaryShellFromMood({ userId: "user-1" }),
    ).resolves.toEqual(
      expect.objectContaining({
        diaryId: "existing",
        shouldGenerateGreeting: false,
      }),
    );

    mockPrisma.diary.findFirst.mockResolvedValueOnce(null);
    mockPrisma.diary.create.mockResolvedValueOnce({ id: "created" });

    await expect(
      ensureDiaryShellFromMood({ userId: "user-1", timezone: "" }),
    ).resolves.toEqual(
      expect.objectContaining({
        diaryId: "created",
        shouldGenerateGreeting: true,
      }),
    );
  });

  it("generateDiaryGreetingFromMood menyimpan sapaan terstruktur dan metadata sekali", async () => {
    mockPrisma.diaryMessage.count.mockResolvedValueOnce(1);

    await generateDiaryGreetingFromMood({
      userId: "user-1",
      moodScore: 5,
      notes: "",
      timezone: "Asia/Jakarta",
      diaryId: "diary-1",
      todayDate,
    });
    expect(mockGenerateDiaryStructuredReply).not.toHaveBeenCalled();

    mockPrisma.diaryMessage.count.mockResolvedValueOnce(0);
    mockPrisma.user.findUnique.mockResolvedValue({ name: null });
    mockPrisma.diary.findFirst.mockResolvedValue({
      topics: [],
      conversationState: ConversationState.EXPLORATION,
    });
    mockTx.diaryMessage.count.mockResolvedValue(0);
    mockGenerateDiaryStructuredReply.mockResolvedValue({
      ...structuredOutput,
      conversationSummary: "Catatan mood yang tidak boleh jadi rangkuman.",
    });

    await generateDiaryGreetingFromMood({
      userId: "user-1",
      moodScore: 2,
      notes: "Capek belajar",
      timezone: "Asia/Jakarta",
      diaryId: "diary-1",
      todayDate,
    });

    expect(mockGenerateDiaryStructuredReply).toHaveBeenCalledWith({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("sapaan pertama"),
        }),
      ]),
    });
    expect(mockTx.diary.update).toHaveBeenCalledWith({
      where: { id: "diary-1" },
      data: expect.objectContaining({
        topics: [DiaryTopic.KELUARGA, DiaryTopic.AKADEMIK_SEKOLAH],
        conversationState: ConversationState.EXPLORATION,
        conversationSummary: null,
        proactiveSuggestion: null,
      }),
    });
    expect(mockTx.diaryMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        diaryId: "diary-1",
        senderType: Sender.AI,
        content: `encrypted:${structuredOutput.reply}`,
      }),
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.diaryMessage.count.mockResolvedValueOnce(0);
    mockGenerateDiaryStructuredReply.mockRejectedValueOnce(
      new Error("AI down"),
    );

    await expect(
      generateDiaryGreetingFromMood({
        userId: "user-1",
        moodScore: 99,
        notes: "",
        timezone: "Asia/Jakarta",
        diaryId: "diary-1",
        todayDate,
      }),
    ).resolves.toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("mood greeting tidak menimpa chat yang sudah masuk saat generation berlangsung", async () => {
    mockPrisma.diaryMessage.count.mockResolvedValueOnce(0);
    mockPrisma.user.findUnique.mockResolvedValue({ name: "Ruri" });
    mockPrisma.diary.findFirst.mockResolvedValue({
      topics: [],
      conversationState: ConversationState.EXPLORATION,
    });
    mockGenerateDiaryStructuredReply.mockResolvedValue(structuredOutput);
    mockTx.diaryMessage.count.mockResolvedValueOnce(1);

    await generateDiaryGreetingFromMood({
      userId: "user-1",
      moodScore: 3,
      notes: "",
      timezone: "Asia/Jakarta",
      diaryId: "diary-1",
      todayDate,
    });

    expect(mockTx.$queryRaw).toHaveBeenCalled();
    expect(mockTx.diary.update).not.toHaveBeenCalled();
    expect(mockTx.diaryMessage.create).not.toHaveBeenCalled();
  });

  it("initiateDiaryFromMood hanya generate greeting saat shell kosong", async () => {
    mockPrisma.diary.findFirst.mockResolvedValueOnce({
      id: "existing",
      messages: [{ id: "m1" }],
    });

    await initiateDiaryFromMood({
      userId: "user-1",
      moodScore: 3,
      notes: "",
    });

    expect(mockGenerateDiaryStructuredReply).not.toHaveBeenCalled();
  });

  it("toDiaryServiceErrorForAiFailure memetakan error AI dan persist", () => {
    expect(
      toDiaryServiceErrorForAiFailure(new DiaryStructuredOutputError()),
    ).toMatchObject({ status: 502, code: "AI_OUTPUT_INVALID" });

    expect(
      toDiaryServiceErrorForAiFailure(
        new DiaryServiceError("x", 418, "TEAPOT"),
      ),
    ).toMatchObject({ status: 418, code: "TEAPOT" });

    expect(
      toDiaryServiceErrorForAiFailure(new Error("empty assistant text")),
    ).toMatchObject({ status: 502, code: "AI_EMPTY_RESPONSE" });

    expect(
      toDiaryServiceErrorForAiFailure(new Error("P2028 expired transaction")),
    ).toMatchObject({ status: 503, code: "DIARY_PERSIST_TIMEOUT" });

    expect(toDiaryServiceErrorForAiFailure("down")).toMatchObject({
      status: 503,
      code: "AI_UNAVAILABLE",
      message: "AI sedang tidak tersedia. Coba kirim lagi.",
    });
  });

  it("sendDiaryChatMessage membungkus error generate dan persist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst.mockResolvedValue({
      id: "diary-1",
      date: todayDate,
    });
    mockPrisma.diaryMessage.findMany.mockResolvedValue([]);
    mockGenerateDiaryAssistantReply.mockRejectedValueOnce(
      new Error("AI unavailable"),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendDiaryChatMessage({
        userId: "user-1",
        entryId: "today",
        messageText: "Halo",
      }),
    ).rejects.toMatchObject({ code: "AI_UNAVAILABLE", status: 503 });
    consoleSpy.mockRestore();

    mockGenerateDiaryAssistantReply.mockResolvedValueOnce("   ");
    await expect(
      sendDiaryChatMessage({
        userId: "user-1",
        entryId: "today",
        messageText: "Halo",
      }),
    ).rejects.toMatchObject({ code: "AI_EMPTY_RESPONSE" });
  });

  it("sendDiaryStructuredChatMessage menolak output invalid sebelum menyimpan", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst.mockResolvedValue(null);
    mockGenerateDiaryStructuredReply.mockRejectedValueOnce(
      new DiaryStructuredOutputError(),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      sendDiaryStructuredChatMessage({
        userId: "user-1",
        entryId: "today",
        messageText: "Aku ingin cerita",
      }),
    ).rejects.toMatchObject({ status: 502, code: "AI_OUTPUT_INVALID" });
    expect(mockGenerateDiaryStructuredReply).toHaveBeenCalledWith({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("satu objek JSON"),
        }),
      ]),
    });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("starter dan jawaban lanjutan memakai riwayat sesi serta memperbarui topik", async () => {
    const starterText = diaryConversationStarters[0].messageText;
    mockPrisma.user.findUnique.mockResolvedValue({
      name: "Ruri",
      isPremium: true,
    });
    mockPrisma.diary.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "diary-1", date: todayDate });
    mockPrisma.diary.findUnique.mockResolvedValueOnce({
      topics: [DiaryTopic.KELUARGA],
      conversationState: ConversationState.EXPLORATION,
      riskLevel: RiskLevel.NONE,
    });
    mockPrisma.diaryMessage.findMany.mockResolvedValueOnce([
      {
        id: "user-1",
        senderType: Sender.USER,
        content: `encrypted:${starterText}`,
        createdAt: today,
      },
      {
        id: "ai-1",
        senderType: Sender.AI,
        content: "encrypted:Apa yang paling ingin kamu ceritakan?",
        createdAt: today,
      },
    ]);
    mockGenerateDiaryStructuredReply
      .mockResolvedValueOnce({
        ...structuredOutput,
        reply: "Apa yang paling ingin kamu ceritakan?",
        topics: [DiaryTopic.KELUARGA],
        conversationState: ConversationState.EXPLORATION,
        proactiveSuggestion: null,
      })
      .mockResolvedValueOnce({
        ...structuredOutput,
        reply:
          "Kedengarannya sekolah ikut membuatmu lelah. Apa yang terjadi di kelas?",
        topics: [DiaryTopic.AKADEMIK_SEKOLAH],
        proactiveSuggestion: null,
      });
    mockTx.diary.create.mockResolvedValue({ id: "diary-1", date: todayDate });
    mockTx.diary.update.mockResolvedValue({ id: "diary-1", date: todayDate });
    mockTx.diaryMessage.create
      .mockResolvedValueOnce({
        id: "user-1",
        senderType: Sender.USER,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "ai-1",
        senderType: Sender.AI,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "user-2",
        senderType: Sender.USER,
        createdAt: today,
      })
      .mockResolvedValueOnce({
        id: "ai-2",
        senderType: Sender.AI,
        createdAt: today,
      });
    mockTx.diary.count.mockResolvedValue(1);

    const first = await sendDiaryStructuredChatMessage({
      userId: "user-1",
      entryId: "today",
      messageText: starterText,
    });
    const second = await sendDiaryStructuredChatMessage({
      userId: "user-1",
      entryId: "diary-1",
      messageText: "Aku capek karena tugas di kelas menumpuk.",
    });

    expect(first.conversation?.topics).toEqual([DiaryTopic.KELUARGA]);
    expect(second.conversation?.topics).toEqual([DiaryTopic.AKADEMIK_SEKOLAH]);
    expect(mockGenerateDiaryStructuredReply).toHaveBeenCalledTimes(2);
    const secondPrompt =
      mockGenerateDiaryStructuredReply.mock.calls[1]?.[0].messages;
    expect(secondPrompt).toEqual(
      expect.arrayContaining([
        { role: "assistant", content: "Apa yang paling ingin kamu ceritakan?" },
        { role: "user", content: "Aku capek karena tugas di kelas menumpuk." },
      ]),
    );
    expect(secondPrompt[1].content).toContain("Ini kelanjutan sesi");
    expect(mockTx.diary.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          topics: [DiaryTopic.AKADEMIK_SEKOLAH],
        }),
      }),
    );
  });
});
