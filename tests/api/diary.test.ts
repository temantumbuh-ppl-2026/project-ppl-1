import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as GET_DIARY } from "@/app/api/diary/route";
import { GET as GET_COUNT } from "@/app/api/diary/count/route";
import { GET as GET_MESSAGES } from "@/app/api/diary/[entryId]/messages/route";
import { POST as POST_CHAT } from "@/app/api/diary/chat/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import {
  DiaryServiceError,
  listDiaryEntriesByMonth,
  getTotalDiaryCount,
  listDiaryMessagesByEntryId,
  sendDiaryChatMessage,
} from "@/lib/diary/service";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
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
  listDiaryEntriesByMonth: vi.fn(),
  getTotalDiaryCount: vi.fn(),
  listDiaryMessagesByEntryId: vi.fn(),
  sendDiaryChatMessage: vi.fn(),
}));

const mockGetAuthId = vi.mocked(getAuthenticatedUserIdFromRequest);
const mockListDiary = vi.mocked(listDiaryEntriesByMonth);
const mockGetCount = vi.mocked(getTotalDiaryCount);
const mockListMessages = vi.mocked(listDiaryMessagesByEntryId);
const mockSendChat = vi.mocked(sendDiaryChatMessage);

describe("Diary API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/diary", () => {
    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);
      const req = new Request("http://localhost/api/diary?month=2024-01");
      const res = await GET_DIARY(req);
      expect(res.status).toBe(401);
    });

    it("Harus return list diary sukses", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockListDiary.mockResolvedValue({
        entries: [{ id: "d1" } as never],
        diarySessionsUsedThisMonth: 1,
      });

      const req = new Request("http://localhost/api/diary?month=2024-01");
      const res = await GET_DIARY(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.entries.length).toBe(1);
    });

    it("Harus return 400 jika month invalid", async () => {
      mockGetAuthId.mockResolvedValue("user1");

      const req = new Request("http://localhost/api/diary?month=salah");
      const res = await GET_DIARY(req);

      expect(res.status).toBe(400);
    });

    it("Harus return DiaryServiceError dari list diary", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockListDiary.mockRejectedValue(
        new DiaryServiceError("Month invalid", 400, "INVALID_MONTH"),
      );

      const req = new Request("http://localhost/api/diary?month=2024-01");
      const res = await GET_DIARY(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe("INVALID_MONTH");
    });

    it("Harus return 500 jika list diary gagal", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetAuthId.mockResolvedValue("user1");
      mockListDiary.mockRejectedValue(new Error("DB down"));

      const req = new Request("http://localhost/api/diary?month=2024-01");
      const res = await GET_DIARY(req);

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });

  describe("GET /api/diary/count", () => {
    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);

      const req = new Request("http://localhost/api/diary/count");
      const res = await GET_COUNT(req);

      expect(res.status).toBe(401);
    });

    it("Harus return total count", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockGetCount.mockResolvedValue(5);

      const req = new Request("http://localhost/api/diary/count");
      const res = await GET_COUNT(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.count).toBe(5);
    });

    it("Harus return 500 jika count gagal", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetAuthId.mockResolvedValue("user1");
      mockGetCount.mockRejectedValue(new Error("DB down"));

      const req = new Request("http://localhost/api/diary/count");
      const res = await GET_COUNT(req);

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });

  describe("GET /api/diary/[entryId]/messages", () => {
    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);

      const req = new Request("http://localhost/api/diary/entry1/messages");
      const context = { params: Promise.resolve({ entryId: "entry1" }) };
      const res = await GET_MESSAGES(req, context);

      expect(res.status).toBe(401);
    });

    it("Harus return list messages", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockListMessages.mockResolvedValue([
        { id: "m1", text: "hello" } as never,
      ]);

      const req = new Request("http://localhost/api/diary/entry1/messages");
      const context = { params: Promise.resolve({ entryId: "entry1" }) };
      const res = await GET_MESSAGES(req, context);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.messages.length).toBe(1);
    });

    it("Harus return DiaryServiceError dari list messages", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockListMessages.mockRejectedValue(
        new DiaryServiceError("Sesi tidak ditemukan", 404, "SESSION_NOT_FOUND"),
      );

      const req = new Request("http://localhost/api/diary/entry1/messages");
      const context = { params: Promise.resolve({ entryId: "entry1" }) };
      const res = await GET_MESSAGES(req, context);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.code).toBe("SESSION_NOT_FOUND");
    });

    it("Harus return 500 jika list messages gagal", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetAuthId.mockResolvedValue("user1");
      mockListMessages.mockRejectedValue(new Error("DB down"));

      const req = new Request("http://localhost/api/diary/entry1/messages");
      const context = { params: Promise.resolve({ entryId: "entry1" }) };
      const res = await GET_MESSAGES(req, context);

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });

  describe("POST /api/diary/chat", () => {
    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);

      const req = new Request("http://localhost/api/diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: "Halo" }),
      });
      const res = await POST_CHAT(req);

      expect(res.status).toBe(401);
    });

    it("Harus return 400 jika payload invalid", async () => {
      mockGetAuthId.mockResolvedValue("user1");

      const req = new Request("http://localhost/api/diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageText: "" }),
      });
      const res = await POST_CHAT(req);

      expect(res.status).toBe(400);
    });

    it("Harus return reply dari chat", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockSendChat.mockResolvedValue({ reply: "Hai!" } as never);

      const req = new Request("http://localhost/api/diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: "e1",
          messageText: "Hello",
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST_CHAT(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.reply).toBe("Hai!");
    });

    it("Harus return DiaryServiceError dari send chat", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockSendChat.mockRejectedValue(
        new DiaryServiceError("AI kosong", 502, "AI_EMPTY_RESPONSE"),
      );

      const req = new Request("http://localhost/api/diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: "today", messageText: "Halo" }),
      });
      const res = await POST_CHAT(req);

      expect(res.status).toBe(502);
      const json = await res.json();
      expect(json.code).toBe("AI_EMPTY_RESPONSE");
    });

    it("Harus return 500 jika send chat gagal", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetAuthId.mockResolvedValue("user1");
      mockSendChat.mockRejectedValue(new Error("DB down"));

      const req = new Request("http://localhost/api/diary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: "today", messageText: "Halo" }),
      });
      const res = await POST_CHAT(req);

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });
});
