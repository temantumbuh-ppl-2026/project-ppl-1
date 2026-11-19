import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockHeaders, mockPrisma } = vi.hoisted(() => ({
  mockAuth: {
    api: {
      getSession: vi.fn(),
    },
  },
  mockHeaders: vi.fn(),
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    quizQuestion: {
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    quizLog: {
      count: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

vi.mock("@/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

import { GET as GET_OVERVIEW } from "@/app/api/admin/overview/route";
import { GET as GET_QUIZ } from "@/app/api/admin/quiz/route";
import { GET as GET_USERS } from "@/app/api/admin/users/route";

describe("Admin API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
  });

  describe("GET /api/admin/overview", () => {
    it("Harus return 401 jika belum login", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const res = await GET_OVERVIEW();

      expect(res.status).toBe(401);
    });

    it("Harus return 403 jika user bukan admin", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({ role: "user" });

      const res = await GET_OVERVIEW();

      expect(res.status).toBe(403);
    });

    it("Harus return statistik dashboard jika user admin", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "admin-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({ role: "admin" });
      mockPrisma.user.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(8)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(4);
      mockPrisma.quizQuestion.count.mockResolvedValue(12);
      mockPrisma.quizLog.count.mockResolvedValue(20);
      mockPrisma.quizQuestion.groupBy.mockResolvedValue([
        { ageSegment: "10-14", _count: { _all: 7 } },
      ]);

      const res = await GET_OVERVIEW();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual({
        totalUsers: 10,
        premiumUsers: 3,
        activeUsers: 8,
        nonActiveUsers: 2,
        totalQuestionsActive: 12,
        newUsersThisMonth: 4,
        quizLogCount: 20,
        segmentCounts: [{ segment: "10-14", count: 7 }],
      });
    });
  });

  describe("GET /api/admin/quiz", () => {
    it("Harus return 401 jika belum login", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const res = await GET_QUIZ();

      expect(res.status).toBe(401);
    });

    it("Harus return 403 jika user bukan admin", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({ role: "user" });

      const res = await GET_QUIZ();

      expect(res.status).toBe(403);
    });

    it("Harus return list quiz untuk admin", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "admin-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({ role: "admin" });
      const questions = [
        {
          id: "q-1",
          scenario: "Skenario",
          category: "Bullying",
          optionA: "A",
          optionB: "B",
          correctOption: "A",
          explanationCorrect: "Benar",
          explanationIncorrect: "Salah",
          ageSegment: "10-14",
          isActive: true,
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ];
      mockPrisma.quizQuestion.findMany.mockResolvedValue(questions);

      const res = await GET_QUIZ();
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual([
        {
          ...questions[0],
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ]);
      expect(mockPrisma.quizQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        }),
      );
    });
  });

  describe("GET /api/admin/users", () => {
    it("Harus return 401 jika belum login", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const res = await GET_USERS(
        new Request("http://localhost/api/admin/users"),
      );

      expect(res.status).toBe(401);
    });

    it("Harus return 403 jika user bukan admin", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "user-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({ role: "user" });

      const res = await GET_USERS(
        new Request("http://localhost/api/admin/users"),
      );

      expect(res.status).toBe(403);
    });

    it("Harus return users non-admin sesuai search filter dan pagination", async () => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "admin-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({ role: "admin" });
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1",
          name: "Budi",
          email: "budi@example.com",
          isPremium: true,
          status: "Aktif",
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
          birthYear: 2008,
          gender: "male",
          profileFilled: true,
          currentStreak: 5,
          parent: { email: "ortu@example.com", status: "verified" },
        },
      ]);
      mockPrisma.user.count.mockResolvedValue(1);

      const res = await GET_USERS(
        new Request(
          "http://localhost/api/admin/users?search=budi&filter=premium&page=2&limit=5",
        ),
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toEqual({
        users: [
          expect.objectContaining({
            id: "user-1",
            parentEmail: "ortu@example.com",
          }),
        ],
        total: 1,
        page: 2,
        limit: 5,
        currentSearch: "budi",
        currentFilter: "premium",
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            role: { not: "admin" },
            isPremium: true,
            OR: [
              { name: { contains: "budi", mode: "insensitive" } },
              { email: { contains: "budi", mode: "insensitive" } },
            ],
          }),
        }),
      );
    });
  });
});
