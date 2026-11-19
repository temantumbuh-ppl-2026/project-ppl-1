import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/mood/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Mocking dependencies
vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    moodLog: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    diary: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockGetAuthenticatedUserIdFromRequest = vi.mocked(
  getAuthenticatedUserIdFromRequest,
);
const mockFindMany = vi.mocked(prisma.moodLog.findMany);
const mockFindFirst = vi.mocked(prisma.moodLog.findFirst);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockDiaryCreate = vi.mocked(prisma.diary.create);
const mockDiaryFindFirst = vi.mocked(prisma.diary.findFirst);

type MockMoodLog = Awaited<ReturnType<typeof prisma.moodLog.findFirst>>;
type MockUser = Awaited<ReturnType<typeof prisma.user.findUnique>>;

describe("Mood API Routes (/api/mood)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDiaryCreate.mockResolvedValue({ id: "d1" } as never);
  });

  describe("GET /api/mood", () => {
    it("Harus return 401 jika user belum login", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue(null);
      const req = new Request("http://localhost/api/mood", { method: "GET" });
      const res = await GET(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("Harus mengembalikan daftar mood dari user yang login", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");
      const mockLogs = [{ id: "m1", moodScore: 4 }];
      mockFindMany.mockResolvedValue(
        mockLogs as unknown as Awaited<
          ReturnType<typeof prisma.moodLog.findMany>
        >,
      );

      const req = new Request("http://localhost/api/mood", { method: "GET" });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockLogs);
    });

    it("Harus return 400 jika query date invalid", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");

      const req = new Request("http://localhost/api/mood?date=salah", {
        method: "GET",
      });
      const res = await GET(req);

      expect(res.status).toBe(400);
    });

    it("Harus return 500 jika get mood logs gagal", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");
      mockFindMany.mockRejectedValue(new Error("DB down"));

      const req = new Request("http://localhost/api/mood", { method: "GET" });
      const res = await GET(req);

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });
  });

  describe("POST /api/mood", () => {
    it("Harus return 401 jika user belum login", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue(null);
      const req = new Request("http://localhost/api/mood", { method: "POST" });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it("Harus return 400 jika payload tidak valid", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");

      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({ moodScore: 10 }), // max is 5, timezone missing
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it("Harus menerima note tepat 100 kata", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");
      mockFindFirst.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        currentStreak: 1,
      } as unknown as MockUser);
      mockTransaction.mockImplementation(() =>
        Promise.resolve([
          { id: "m-note-100", moodScore: 4 },
          { id: "user1", currentStreak: 2 },
        ]),
      );
      mockDiaryFindFirst.mockResolvedValue(null);

      const note = Array.from(
        { length: 100 },
        (_, index) => `kata${index}`,
      ).join(" ");
      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({
          moodScore: 4,
          note,
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("Harus return 400 jika note lebih dari 100 kata", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");
      const note = Array.from(
        { length: 101 },
        (_, index) => `kata${index}`,
      ).join(" ");

      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({
          moodScore: 4,
          note,
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("Harus menerima note kosong sebagai opsional", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");
      mockFindFirst.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        currentStreak: 1,
      } as unknown as MockUser);
      mockTransaction.mockImplementation(() =>
        Promise.resolve([
          { id: "m-empty-note", moodScore: 3 },
          { id: "user1", currentStreak: 2 },
        ]),
      );
      mockDiaryFindFirst.mockResolvedValue(null);

      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({
          moodScore: 3,
          note: "",
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
    });

    it("Harus return 200 dan menambah streak jika valid dan berhasil tambah", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");

      // Mock service db behaviors
      mockFindFirst.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        currentStreak: 3,
      } as unknown as MockUser);
      mockTransaction.mockImplementation(() =>
        Promise.resolve([
          { id: "m1", moodScore: 5 },
          { id: "user1", currentStreak: 4 },
        ]),
      );
      mockDiaryFindFirst.mockResolvedValue(null);

      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({
          moodScore: 5,
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.currentStreak).toBe(4);
    });

    it("Harus return diary ready jika diary hari ini sudah ada pesan", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");
      mockFindFirst.mockResolvedValue(null);
      mockFindUnique.mockResolvedValue({
        currentStreak: 2,
      } as unknown as MockUser);
      mockTransaction.mockImplementation(() =>
        Promise.resolve([
          { id: "m2", moodScore: 4 },
          { id: "user1", currentStreak: 3 },
        ]),
      );
      mockDiaryFindFirst.mockResolvedValue({
        id: "existing-diary",
        messages: [{ id: "msg-1" }],
      } as never);

      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({
          moodScore: 4,
          timezone: "Asia/Jakarta",
        }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.diary).toEqual({
        id: "existing-diary",
        greetingStatus: "ready",
      });
    });

    it("Harus menolak dengan 409 jika submit berkali-kali di hari yang sama (lokal)", async () => {
      mockGetAuthenticatedUserIdFromRequest.mockResolvedValue("user1");

      // Simulasikan udah mengisi hari ini (jam terserah dalam UTC, formatter lokal sama)
      const now = new Date();
      mockFindFirst.mockResolvedValue({
        createdAt: now,
      } as unknown as MockMoodLog);
      mockFindUnique.mockResolvedValue({
        currentStreak: 3,
      } as unknown as MockUser);

      const req = new Request("http://localhost/api/mood", {
        method: "POST",
        body: JSON.stringify({
          moodScore: 3,
          timezone: "Asia/Jakarta", // local eval
        }),
      });

      const res = await POST(req);

      // Sesuai implementasi kita: return NextResponse config error.status 409
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toMatch(/sudah mengisi/i);
    });
  });
});
