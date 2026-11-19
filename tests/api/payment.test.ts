import { describe, it, expect, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/payment/create/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { getDurationPricing } from "@/lib/subscription/plans";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    payment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/midtrans", () => ({
  default: {
    createTransaction: vi.fn(),
  },
}));

import prisma from "@/lib/prisma";
import snap from "@/lib/midtrans";

const mockGetAuthId = vi.mocked(getAuthenticatedUserIdFromRequest);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockPaymentFindFirst = vi.mocked(prisma.payment.findFirst);
const mockPaymentCreate = vi.mocked(prisma.payment.create);
const mockPaymentUpdate = vi.mocked(prisma.payment.update);
const mockCreateTransaction = vi.mocked(snap.createTransaction);

describe("Payment API Routes (/api/payment/create)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPaymentFindFirst.mockResolvedValue(null);
  });

  describe("POST /api/payment/create", () => {
    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);
      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 1 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("Harus return 400 jika durasi tidak valid", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 2 }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("Harus return 200 dengan snap token jika valid", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockUserFindUnique.mockResolvedValue({
        id: "user1",
        name: "Test User",
        email: "test@example.com",
      } as never);
      mockPaymentCreate.mockResolvedValue({
        id: "pay1",
        orderId: "TT-user1-123",
        durationMonths: 1,
      } as never);
      mockPaymentUpdate.mockResolvedValue({} as never);
      mockCreateTransaction.mockResolvedValue({
        token: "snap-token-123",
        redirect_url: "https://app.sandbox.midtrans.com/snap/v2/xxx",
      } as never);

      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 1 }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.token).toBe("snap-token-123");
    });

    it("Harus menagih harga hemat sesuai durasi, sama dengan tampilan", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockUserFindUnique.mockResolvedValue({
        id: "user1",
        name: "Test User",
        email: "test@example.com",
      } as never);
      mockPaymentCreate.mockResolvedValue({
        id: "pay1",
        orderId: "TT-user1-123",
        durationMonths: 3,
      } as never);
      mockPaymentUpdate.mockResolvedValue({} as never);
      mockCreateTransaction.mockResolvedValue({
        token: "snap-token-123",
        redirect_url: "https://app.sandbox.midtrans.com/snap/v2/xxx",
      } as never);

      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 3 }),
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockPaymentCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          grossAmount: getDurationPricing(3).price,
          durationMonths: 3,
        }),
      });

      const param = mockCreateTransaction.mock.calls[0][0] as {
        transaction_details: { gross_amount: number };
        item_details: Array<{ price: number; quantity: number }>;
      };
      expect(param.transaction_details.gross_amount).toBe(159000);
      // Midtrans mensyaratkan jumlah item sama dengan gross_amount.
      const itemTotal = param.item_details.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      expect(itemTotal).toBe(param.transaction_details.gross_amount);
    });

    it("Harus return 404 jika user tidak ditemukan", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockUserFindUnique.mockResolvedValue(null);

      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 1 }),
      });
      const res = await POST(req);

      expect(res.status).toBe(404);
    });

    it("Harus return 500 jika create transaction gagal", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetAuthId.mockResolvedValue("user1");
      mockUserFindUnique.mockResolvedValue({
        id: "user1",
        name: null,
        email: "test@example.com",
      } as never);
      mockPaymentCreate.mockResolvedValue({
        id: "pay1",
        orderId: "TT-user1-123",
      } as never);
      mockCreateTransaction.mockRejectedValue(new Error("Midtrans down"));

      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 1 }),
      });
      const res = await POST(req);

      expect(res.status).toBe(500);
      consoleSpy.mockRestore();
    });

    it("Harus return 409 jika user masih punya pembayaran pending", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockPaymentFindFirst.mockResolvedValue({
        id: "pay-pending",
        orderId: "TT-user1-pending",
        durationMonths: 3,
        grossAmount: 177000,
        status: "pending",
        snapToken: "snap-token-pending",
        createdAt: new Date("2026-04-25T10:00:00.000Z"),
      } as never);

      const req = new Request("http://localhost/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMonths: 1 }),
      });
      const res = await POST(req);

      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.code).toBe("PENDING_PAYMENT_EXISTS");
      expect(json.pendingPayment.token).toBe("snap-token-pending");
      expect(mockPaymentCreate).not.toHaveBeenCalled();
    });
  });
});
