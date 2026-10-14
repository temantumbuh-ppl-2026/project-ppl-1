import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/diary/chat/stream/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import {
  completePreparedDiaryStructuredChatSession,
  DiaryServiceError,
  prepareDiaryChatSession,
} from "@/lib/diary/service";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/diary/service", () => {
  class MockDiaryServiceError extends Error {
    constructor(
      message: string,
      public status = 400,
      public code = "DIARY_ERROR",
    ) {
      super(message);
    }
  }

  return {
    DiaryServiceError: MockDiaryServiceError,
    prepareDiaryChatSession: vi.fn(),
    completePreparedDiaryStructuredChatSession: vi.fn(),
    toDiaryServiceErrorForAiFailure: vi.fn(
      () =>
        new MockDiaryServiceError(
          "AI sedang tidak tersedia.",
          503,
          "AI_UNAVAILABLE",
        ),
    ),
  };
});

const mockAuth = vi.mocked(getAuthenticatedUserIdFromRequest);
const mockPrepare = vi.mocked(prepareDiaryChatSession);
const mockComplete = vi.mocked(completePreparedDiaryStructuredChatSession);

function request(body: unknown) {
  return new Request("http://localhost/api/diary/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function collectEvents(response: Response) {
  const blocks = (await response.text()).split("\n\n").filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split("\n");
    const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
    const data = lines.find((line) => line.startsWith("data: "))?.slice(6);
    return { event, data: data ? JSON.parse(data) : null };
  });
}

describe("POST /api/diary/chat/stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("menolak request tanpa autentikasi", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await POST(
      request({ entryId: "today", messageText: "Halo" }),
    );
    expect(response.status).toBe(401);
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it("menolak payload kosong", async () => {
    mockAuth.mockResolvedValue("user-1");
    const response = await POST(request({ entryId: "today", messageText: "" }));
    expect(response.status).toBe(400);
    expect(mockPrepare).not.toHaveBeenCalled();
  });

  it("mengirim satu chunk sesudah output tervalidasi dan tersimpan", async () => {
    mockAuth.mockResolvedValue("user-1");
    const session = {
      structuredPromptMessages: [{ role: "user", content: "Halo" }],
    };
    mockPrepare.mockResolvedValue(session as never);
    const result = {
      aiMessage: {
        id: "ai-1",
        role: "ai",
        text: "Aku mendengarmu.",
        time: "09.00",
      },
      entry: {
        id: "diary-1",
        date: "2026-05-23",
        dateLabel: "Sabtu",
        preview: "Halo",
        mood: 3,
        isToday: true,
      },
      diarySessionsUsedThisMonth: 1,
      conversation: {
        topics: ["KELUARGA", "AKADEMIK_SEKOLAH"],
        conversationState: "CLARIFICATION",
        proactiveSuggestion: null,
        safetyFlag: false,
        riskLevel: "NONE",
      },
    };
    mockComplete.mockResolvedValue(result as never);

    const response = await POST(
      request({
        entryId: "today",
        messageText: "Halo",
        timezone: "Asia/Jakarta",
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(mockPrepare).toHaveBeenCalledWith(
      {
        userId: "user-1",
        entryId: "today",
        messageText: "Halo",
        timezone: "Asia/Jakarta",
      },
      { includeMetadata: true },
    );
    expect(mockComplete).toHaveBeenCalledWith(session);

    const events = await collectEvents(response);
    expect(events).toEqual([
      { event: "chunk", data: { text: "Aku mendengarmu." } },
      { event: "done", data: result },
    ]);
  });

  it("mengirim error tanpa chunk bila validasi AI gagal", async () => {
    mockAuth.mockResolvedValue("user-1");
    mockPrepare.mockResolvedValue({} as never);
    mockComplete.mockRejectedValue(
      new DiaryServiceError(
        "Balasan AI tidak valid.",
        502,
        "AI_OUTPUT_INVALID",
      ),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      request({ entryId: "today", messageText: "Halo" }),
    );
    expect(response.status).toBe(200);
    expect(await collectEvents(response)).toEqual([
      {
        event: "error",
        data: {
          error: "Balasan AI tidak valid.",
          code: "AI_OUTPUT_INVALID",
          status: 502,
        },
      },
    ]);
    consoleSpy.mockRestore();
  });

  it("mengembalikan 404 sebelum SSE bila diary tidak dimiliki pengguna", async () => {
    mockAuth.mockResolvedValue("user-1");
    mockPrepare.mockRejectedValue(
      new DiaryServiceError("Sesi tidak ditemukan.", 404, "SESSION_NOT_FOUND"),
    );
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(
      request({ entryId: "other-diary", messageText: "Halo" }),
    );
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("SESSION_NOT_FOUND");
    expect(mockComplete).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
