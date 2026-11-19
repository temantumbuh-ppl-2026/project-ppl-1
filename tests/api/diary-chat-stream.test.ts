import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/diary/chat/stream/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { generateDiaryAssistantReplyStream } from "@/lib/diary/litellm";
import {
  DiaryServiceError,
  prepareDiaryChatSession,
  persistDiaryChatSession,
} from "@/lib/diary/service";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/diary/litellm", () => ({
  generateDiaryAssistantReplyStream: vi.fn(),
}));

vi.mock("@/lib/diary/service", () => ({
  DiaryServiceError: class DiaryServiceError extends Error {
    status: number;
    code: string;
    constructor(message: string, status = 400, code = "DIARY_ERROR") {
      super(message);
      this.name = "DiaryServiceError";
      this.status = status;
      this.code = code;
    }
  },
  prepareDiaryChatSession: vi.fn(),
  persistDiaryChatSession: vi.fn(),
  toDiaryServiceErrorForAiFailure: vi.fn((err: unknown) => {
    const DiaryServiceErrorClass = class extends Error {
      status = 500;
      code = "AI_FAILURE";
      constructor(msg: string) {
        super(msg);
      }
    };
    return new DiaryServiceErrorClass(
      err instanceof Error ? err.message : "AI error",
    );
  }),
}));

const mockGetAuthId = vi.mocked(getAuthenticatedUserIdFromRequest);
const mockPrepareDiaryChatSession = vi.mocked(prepareDiaryChatSession);
const mockPersistDiaryChatSession = vi.mocked(persistDiaryChatSession);
const mockGenerateDiaryAssistantReplyStream = vi.mocked(
  generateDiaryAssistantReplyStream,
);

// Helper: baca SSE stream menjadi array event
async function collectSseEvents(
  response: Response,
): Promise<Array<{ event: string; data: unknown }>> {
  const text = await response.text();
  const events: Array<{ event: string; data: unknown }> = [];
  const blocks = text.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    let event = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) event = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (event && data) {
      events.push({ event, data: JSON.parse(data) });
    }
  }

  return events;
}

describe("Diary Chat Stream API (/api/diary/chat/stream)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/diary/chat/stream", () => {
    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: "Halo", entryId: "today" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("Harus return 400 jika payload tidak valid (messageText kosong)", async () => {
      mockGetAuthId.mockResolvedValue("user1");

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: "", entryId: "today" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeTruthy();
    });

    it("Harus return 400 jika messageText tidak dikirim", async () => {
      mockGetAuthId.mockResolvedValue("user1");

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: "today" }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("Harus return SSE stream dengan event chunk dan done jika berhasil", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockPrepareDiaryChatSession.mockResolvedValue({
        promptMessages: [{ role: "user", content: "Halo" }],
      } as never);

      // Mock generator: yield 2 chunks
      async function* fakeStream() {
        yield "Halo";
        yield ", apa kabar?";
      }
      mockGenerateDiaryAssistantReplyStream.mockReturnValue(
        fakeStream() as never,
      );
      mockPersistDiaryChatSession.mockResolvedValue({
        reply: "Halo, apa kabar?",
        entryId: "entry-1",
      } as never);

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: "Halo",
          entryId: "today",
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/event-stream");

      const events = await collectSseEvents(res);

      // Harus ada 2 chunk events
      const chunkEvents = events.filter((e) => e.event === "chunk");
      expect(chunkEvents).toHaveLength(2);
      expect((chunkEvents[0]!.data as { text: string }).text).toBe("Halo");
      expect((chunkEvents[1]!.data as { text: string }).text).toBe(
        ", apa kabar?",
      );

      // Harus ada 1 done event
      const doneEvents = events.filter((e) => e.event === "done");
      expect(doneEvents).toHaveLength(1);
    });

    it("Harus kirim event error di stream jika AI stream gagal", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockPrepareDiaryChatSession.mockResolvedValue({
        promptMessages: [],
      } as never);

      // Mock generator yang throw error
      async function* failingStream() {
        throw new Error("AI unavailable");
        yield "";
      }
      mockGenerateDiaryAssistantReplyStream.mockReturnValue(
        failingStream() as never,
      );

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: "Halo",
          entryId: "today",
        }),
      });
      const res = await POST(req);

      // Response tetap 200 (karena stream sudah dimulai)
      expect(res.status).toBe(200);

      const events = await collectSseEvents(res);
      const errorEvents = events.filter((e) => e.event === "error");
      expect(errorEvents.length).toBeGreaterThan(0);
    });

    it("Harus return 4xx jika prepareDiaryChatSession throw DiaryServiceError", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockPrepareDiaryChatSession.mockRejectedValue(
        new DiaryServiceError(
          "Sesi diary tidak ditemukan.",
          404,
          "SESSION_NOT_FOUND",
        ),
      );

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: "Halo",
          entryId: "entry-nonexistent",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe("SESSION_NOT_FOUND");
    });

    it("Harus memanggil prepareDiaryChatSession dengan parameter yang benar", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockPrepareDiaryChatSession.mockResolvedValue({
        promptMessages: [],
      } as never);

      async function* emptyStream() {
        // no chunks
      }
      mockGenerateDiaryAssistantReplyStream.mockReturnValue(
        emptyStream() as never,
      );
      mockPersistDiaryChatSession.mockResolvedValue({} as never);

      const req = new Request("http://localhost/api/diary/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageText: "Cerita dong",
          entryId: "entry-abc",
          timezone: "Asia/Jakarta",
        }),
      });
      await POST(req);

      expect(mockPrepareDiaryChatSession).toHaveBeenCalledWith({
        userId: "user1",
        entryId: "entry-abc",
        messageText: "Cerita dong",
        timezone: "Asia/Jakarta",
      });
    });
  });
});
