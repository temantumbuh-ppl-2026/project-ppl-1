import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth, mockHeaders, mockPrisma } = vi.hoisted(() => ({
  mockAuth: {
    api: {
      getSession: vi.fn(),
    },
  },
  mockHeaders: vi.fn(),
  mockPrisma: {
    $transaction: vi.fn(),
    safetyAlert: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
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
import { GET as GET_SAFETY } from "@/app/api/admin/safety-alerts/route";
import {
  GET as GET_SAFETY_DETAIL,
  PATCH as PATCH_SAFETY,
} from "@/app/api/admin/safety-alerts/[alertId]/route";
import { encrypt, decrypt } from "@/lib/encryption";

describe("Admin API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHeaders.mockResolvedValue(new Headers());
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
    mockPrisma.$transaction.mockImplementation((input) =>
      typeof input === "function" ? input(mockPrisma) : Promise.all(input),
    );
    mockPrisma.safetyAlert.findMany.mockReset().mockResolvedValue([]);
    mockPrisma.safetyAlert.count.mockReset().mockResolvedValue(0);
    mockPrisma.safetyAlert.findFirst.mockReset().mockResolvedValue(null);
    mockPrisma.safetyAlert.updateMany
      .mockReset()
      .mockResolvedValue({ count: 1 });
  });
  afterEach(() => vi.unstubAllEnvs());

  describe("Safety Alert API", () => {
    const context = () => ({ params: Promise.resolve({ alertId: "alert-1" }) });
    const request = (method = "GET", payload?: unknown) =>
      new Request("http://localhost/api/admin/safety-alerts/alert-1", {
        method,
        ...(payload !== undefined
          ? {
              body: JSON.stringify(payload),
              headers: { "Content-Type": "application/json" },
            }
          : {}),
      });
    const row = (overrides: Record<string, unknown> = {}) => ({
      id: "alert-1",
      riskLevel: "HIGH",
      category: "SELF_HARM",
      status: "OPEN",
      createdAt: new Date("2026-11-05T08:00:00Z"),
      updatedAt: new Date("2026-11-05T08:00:00Z"),
      reviewedAt: null,
      reviewNote: null,
      reviewedBy: null,
      diary: {
        userId: "private-user-id",
        user: { email: "student@example.invalid", name: "Private User" },
      },
      summary: "PRIVATE_SUMMARY",
      content: "PRIVATE_CONVERSATION",
      user: { name: "Private User", email: "private@example.invalid" },
      ...overrides,
    });
    beforeEach(() => {
      mockAuth.api.getSession.mockResolvedValue({ user: { id: "admin-1" } });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "admin-1",
        name: "Reviewer",
        role: "admin",
      });
    });

    const handlers = [
      () => GET_SAFETY(new Request("http://localhost/api/admin/safety-alerts")),
      () => GET_SAFETY_DETAIL(request(), context()),
      () => PATCH_SAFETY(request("PATCH", { status: "REVIEWED" }), context()),
    ];
    it.each(handlers)(
      "menolak session kosong sebelum membaca alert",
      async (handler) => {
        mockAuth.api.getSession.mockResolvedValue(null);
        expect((await handler()).status).toBe(401);
        expect(mockPrisma.safetyAlert.findFirst).not.toHaveBeenCalled();
        expect(mockPrisma.safetyAlert.findMany).not.toHaveBeenCalled();
      },
    );
    it.each(handlers)(
      "memeriksa role dari DB dan menolak pengguna biasa",
      async (handler) => {
        mockAuth.api.getSession.mockResolvedValue({
          user: { id: "user-1", role: "admin" },
        });
        mockPrisma.user.findUnique.mockResolvedValue({
          id: "user-1",
          role: "user",
        });
        expect((await handler()).status).toBe(403);
        expect(mockPrisma.safetyAlert.findFirst).not.toHaveBeenCalled();
        expect(mockPrisma.safetyAlert.updateMany).not.toHaveBeenCalled();
      },
    );

    it("mengembalikan email pemilik alert tanpa data percakapan atau profil lainnya", async () => {
      mockPrisma.safetyAlert.findMany.mockResolvedValue([
        row(),
        row({ id: "alert-2" }),
        row({
          id: "alert-3",
          diary: { user: { email: "another@example.invalid" } },
        }),
      ]);
      mockPrisma.safetyAlert.count.mockResolvedValue(3);
      const response = await GET_SAFETY(
        new Request(
          "http://localhost/api/admin/safety-alerts?status=all&riskLevel=all&category=SELF_HARM&page=2&limit=5",
        ),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
      const body = await response.json();
      expect(body.data).toMatchObject({ total: 3, page: 2, limit: 5 });
      expect(
        body.data.alerts.map((alert: { userEmail: string }) => alert.userEmail),
      ).toEqual([
        "student@example.invalid",
        "student@example.invalid",
        "another@example.invalid",
      ]);
      expect(body.data.alerts[0]).not.toHaveProperty("anonymousUserId");
      expect(JSON.stringify(body)).not.toMatch(
        /PRIVATE_|private-user|Private User|private@example|summary|content|diary/,
      );
      expect(mockPrisma.safetyAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: { riskLevel: "HIGH", category: "SELF_HARM" },
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        }),
      );
      const select = mockPrisma.safetyAlert.findMany.mock.calls[0][0].select;
      expect(select.diary).toEqual({
        select: { user: { select: { email: true } } },
      });
      expect(select).not.toHaveProperty("summary");
      expect(select).not.toHaveProperty("triggerMessage");
      expect(select).not.toHaveProperty("reviewNote");
    });

    it("default OPEN/HIGH dan filter ATTENTION tidak membuka alert di luar HIGH", async () => {
      await GET_SAFETY(new Request("http://localhost/api/admin/safety-alerts"));
      expect(mockPrisma.safetyAlert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "OPEN", riskLevel: "HIGH" },
          take: 10,
          skip: 0,
        }),
      );
      const response = await GET_SAFETY(
        new Request(
          "http://localhost/api/admin/safety-alerts?riskLevel=ATTENTION",
        ),
      );
      expect(response.status).toBe(200);
      expect(mockPrisma.safetyAlert.findMany).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            riskLevel: "HIGH",
            AND: [{ riskLevel: "ATTENTION" }],
          }),
        }),
      );
    });

    it.each([
      "page=0",
      "page=1.5",
      "page=Infinity",
      "limit=51",
      "limit=-1",
      "status=BOGUS",
      "riskLevel=NONE",
      "category=BOGUS",
      "include=messages",
      "userId=someone",
    ])("menolak query tidak valid: %s", async (query) => {
      expect(
        (
          await GET_SAFETY(
            new Request(`http://localhost/api/admin/safety-alerts?${query}`),
          )
        ).status,
      ).toBe(400);
      expect(mockPrisma.safetyAlert.findMany).not.toHaveBeenCalled();
    });

    it("detail hanya mendekripsi catatan review dan menampilkan nama admin reviewer", async () => {
      mockPrisma.safetyAlert.findFirst.mockResolvedValue(
        row({
          status: "REVIEWED",
          reviewNote: encrypt("Tinjauan administratif."),
          reviewedBy: { name: "Reviewer" },
          reviewedAt: new Date("2026-11-05T09:00:00Z"),
        }),
      );
      const response = await GET_SAFETY_DETAIL(request(), context());
      const body = await response.json();
      expect(body.data.alert).toMatchObject({
        userEmail: "student@example.invalid",
        reviewNote: "Tinjauan administratif.",
        reviewedByName: "Reviewer",
        allowedStatuses: ["REVIEWED", "RESOLVED"],
        reviewedAt: "2026-11-05T09:00:00.000Z",
      });
      expect(JSON.stringify(body)).not.toMatch(
        /PRIVATE_|private-user|Private User|private@example|summary|content|triggerMessage|diaryId/,
      );
      expect(
        mockPrisma.safetyAlert.findFirst.mock.calls[0][0].select,
      ).not.toHaveProperty("summary");
    });
    it.each(["GET", "PATCH"])(
      "%s mengembalikan 404 untuk alert yang tidak tersedia",
      async (method) => {
        const response =
          method === "GET"
            ? await GET_SAFETY_DETAIL(request(), context())
            : await PATCH_SAFETY(
                request("PATCH", { status: "REVIEWED" }),
                context(),
              );
        expect(response.status).toBe(404);
      },
    );

    it.each([
      { status: "BOGUS" },
      { status: "REVIEWED", reviewNote: "a".repeat(1001) },
      { status: "REVIEWED", reviewedById: "another-admin" },
      { status: "REVIEWED", reviewedAt: "2026-11-05T00:00:00Z" },
      { status: "REVIEWED", riskLevel: "NONE" },
      { status: "REVIEWED", expectedUpdatedAt: "yesterday" },
    ])("menolak PATCH invalid atau field milik server", async (payload) => {
      expect(
        (await PATCH_SAFETY(request("PATCH", payload), context())).status,
      ).toBe(400);
      expect(mockPrisma.safetyAlert.updateMany).not.toHaveBeenCalled();
    });
    it("menolak JSON rusak", async () => {
      const response = await PATCH_SAFETY(
        new Request("http://localhost/api/admin/safety-alerts/alert-1", {
          method: "PATCH",
          body: "{invalid",
        }),
        context(),
      );
      expect(response.status).toBe(400);
    });

    it("menyimpan reviewer dari session, waktu server, dan catatan terenkripsi", async () => {
      const note = "Tinjauan administratif.";
      mockPrisma.safetyAlert.findFirst
        .mockResolvedValueOnce(row())
        .mockResolvedValueOnce(
          row({
            status: "REVIEWED",
            reviewNote: encrypt(note),
            reviewedBy: { name: "Reviewer" },
            reviewedAt: new Date(),
          }),
        );
      const response = await PATCH_SAFETY(
        request("PATCH", { status: "REVIEWED", reviewNote: ` ${note} ` }),
        context(),
      );
      expect(response.status).toBe(200);
      const saved = mockPrisma.safetyAlert.updateMany.mock.calls[0][0];
      expect(saved.where).toMatchObject({
        id: "alert-1",
        riskLevel: "HIGH",
        status: "OPEN",
        updatedAt: row().updatedAt,
      });
      expect(saved.data).toMatchObject({
        status: "REVIEWED",
        reviewedById: "admin-1",
        reviewedAt: expect.any(Date),
      });
      expect(saved.data.reviewNote).not.toBe(note);
      expect(
        decrypt(saved.data.reviewNote, { allowLegacyPlaintext: false }),
      ).toBe(note);
      expect((await response.json()).data.alert).toMatchObject({
        userEmail: "student@example.invalid",
        reviewNote: note,
      });
    });
    it("menerima catatan tepat 1000 karakter sesuai kontrak frontend", async () => {
      const note = "a".repeat(1000);
      mockPrisma.safetyAlert.findFirst
        .mockResolvedValueOnce(row())
        .mockResolvedValueOnce(
          row({ status: "REVIEWED", reviewNote: encrypt(note) }),
        );
      const response = await PATCH_SAFETY(
        request("PATCH", { status: "REVIEWED", reviewNote: note }),
        context(),
      );
      expect(response.status).toBe(200);
      expect((await response.json()).data.alert.reviewNote).toHaveLength(1000);
    });
    it.each(["", null])(
      "memungkinkan penghapusan catatan tanpa mengirim plaintext",
      async (reviewNote) => {
        mockPrisma.safetyAlert.findFirst.mockResolvedValue(
          row({ status: "REVIEWED" }),
        );
        expect(
          (
            await PATCH_SAFETY(
              request("PATCH", { status: "REVIEWED", reviewNote }),
              context(),
            )
          ).status,
        ).toBe(200);
        expect(
          mockPrisma.safetyAlert.updateMany.mock.calls[0][0].data.reviewNote,
        ).toBeNull();
      },
    );
    it("catatan yang tidak dikirim tetap dipertahankan", async () => {
      mockPrisma.safetyAlert.findFirst.mockResolvedValue(
        row({ status: "REVIEWED" }),
      );
      expect(
        (
          await PATCH_SAFETY(
            request("PATCH", { status: "RESOLVED" }),
            context(),
          )
        ).status,
      ).toBe(200);
      expect(
        mockPrisma.safetyAlert.updateMany.mock.calls[0][0].data,
      ).not.toHaveProperty("reviewNote");
    });
    it.each([
      ["OPEN", "RESOLVED"],
      ["REVIEWED", "OPEN"],
      ["RESOLVED", "REVIEWED"],
    ])("menolak transisi %s ke %s", async (current, next) => {
      mockPrisma.safetyAlert.findFirst.mockResolvedValue(
        row({ status: current }),
      );
      expect(
        (await PATCH_SAFETY(request("PATCH", { status: next }), context()))
          .status,
      ).toBe(409);
      expect(mockPrisma.safetyAlert.updateMany).not.toHaveBeenCalled();
    });
    it("menolak versi form lama sebelum menulis", async () => {
      mockPrisma.safetyAlert.findFirst.mockResolvedValue(row());
      expect(
        (
          await PATCH_SAFETY(
            request("PATCH", {
              status: "REVIEWED",
              expectedUpdatedAt: "2026-11-04T08:00:00Z",
            }),
            context(),
          )
        ).status,
      ).toBe(409);
      expect(mockPrisma.safetyAlert.updateMany).not.toHaveBeenCalled();
    });
    it("versi review selalu bertambah meskipun pembaruan terjadi dalam milidetik yang sama", async () => {
      const updatedAt = new Date("2099-01-01T00:00:00.000Z");
      mockPrisma.safetyAlert.findFirst.mockResolvedValue(
        row({ status: "REVIEWED", updatedAt }),
      );
      expect(
        (
          await PATCH_SAFETY(
            request("PATCH", {
              status: "REVIEWED",
              reviewNote: "Catatan baru.",
            }),
            context(),
          )
        ).status,
      ).toBe(200);
      expect(
        mockPrisma.safetyAlert.updateMany.mock.calls[0][0].data.updatedAt.getTime(),
      ).toBe(updatedAt.getTime() + 1);
    });
    it("menangani pembaruan bersamaan tanpa menimpa reviewer lain", async () => {
      mockPrisma.safetyAlert.findFirst.mockResolvedValue(row());
      mockPrisma.safetyAlert.updateMany.mockResolvedValue({ count: 0 });
      expect(
        (
          await PATCH_SAFETY(
            request("PATCH", { status: "REVIEWED" }),
            context(),
          )
        ).status,
      ).toBe(409);
    });
    it.each(["catatan plaintext", "broken:cipher:text"])(
      "dekripsi gagal tidak mengirim catatan atau ciphertext",
      async (reviewNote) => {
        mockPrisma.safetyAlert.findFirst.mockResolvedValue(row({ reviewNote }));
        const response = await GET_SAFETY_DETAIL(request(), context());
        expect(response.status).toBe(503);
        expect(JSON.stringify(await response.json())).not.toContain(reviewNote);
      },
    );
    it("kegagalan enkripsi membatalkan perubahan review", async () => {
      vi.stubEnv("ENCRYPTION_KEY", "");
      expect(
        (
          await PATCH_SAFETY(
            request("PATCH", {
              status: "REVIEWED",
              reviewNote: "Jangan simpan terbuka.",
            }),
            context(),
          )
        ).status,
      ).toBe(503);
      expect(mockPrisma.safetyAlert.updateMany).not.toHaveBeenCalled();
    });
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
