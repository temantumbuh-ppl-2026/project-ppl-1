import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockPrisma, mockTx } = vi.hoisted(() => {
  const tx = {
    diary: {
      create: vi.fn(),
    },
    diaryMessage: {
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

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((value: string) => `encrypted:${value}`),
  decrypt: vi.fn((value: string) => value.replace(/^encrypted:/, "")),
}));

vi.mock("@/lib/diary/litellm", () => ({
  generateDiaryAssistantReply: mockGenerateDiaryAssistantReply,
}));

import { Sender } from "@/app/generated/prisma/client";
import {
  DiaryServiceError,
  ensureDiaryShellFromMood,
  generateDiaryGreetingFromMood,
  getTotalDiaryCount,
  initiateDiaryFromMood,
  listDiaryEntriesByMonth,
  listDiaryMessagesByEntryId,
  persistDiaryChatSession,
  prepareDiaryChatSession,
  sendDiaryChatMessage,
  toDiaryServiceErrorForAiFailure,
  type PreparedDiaryChatSession,
} from "@/lib/diary/service";

const today = new Date("2026-05-23T03:00:00.000Z");
const todayDate = new Date(Date.UTC(2026, 4, 23));

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
  });

  it("persistDiaryChatSession menolak balasan AI kosong", async () => {
    await expect(
      persistDiaryChatSession({
        session: createSession(),
        assistantText: "   ",
      }),
    ).rejects.toMatchObject({ code: "AI_EMPTY_RESPONSE", status: 502 });
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
    mockPrisma.diary.count.mockResolvedValue(3);

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

  it("generateDiaryGreetingFromMood membuat greeting sekali dan mengabaikan error AI", async () => {
    mockPrisma.diaryMessage.count.mockResolvedValueOnce(1);

    await generateDiaryGreetingFromMood({
      userId: "user-1",
      moodScore: 5,
      notes: "",
      timezone: "Asia/Jakarta",
      diaryId: "diary-1",
      todayDate,
    });
    expect(mockGenerateDiaryAssistantReply).not.toHaveBeenCalled();

    mockPrisma.diaryMessage.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    mockPrisma.user.findUnique.mockResolvedValue({ name: null });
    mockGenerateDiaryAssistantReply.mockResolvedValue(" Halo, aku di sini. ");

    await generateDiaryGreetingFromMood({
      userId: "user-1",
      moodScore: 2,
      notes: "Capek belajar",
      timezone: "Asia/Jakarta",
      diaryId: "diary-1",
      todayDate,
    });

    expect(mockPrisma.diaryMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        diaryId: "diary-1",
        senderType: Sender.AI,
        content: "encrypted:Halo, aku di sini.",
      }),
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockPrisma.diaryMessage.count.mockResolvedValueOnce(0);
    mockGenerateDiaryAssistantReply.mockRejectedValueOnce(new Error("AI down"));

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

    expect(mockGenerateDiaryAssistantReply).not.toHaveBeenCalled();
  });

  it("toDiaryServiceErrorForAiFailure memetakan error AI dan persist", () => {
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
});
