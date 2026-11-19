import type { Prisma } from "@/app/generated/prisma/client";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST as POST_CANCEL } from "@/app/api/payment/cancel/route";
import { POST as POST_NOTIFICATION } from "@/app/api/payment/notification/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import {
  getLatestPendingPayment,
  activateSubscription,
  syncUserPremiumStatus,
} from "@/lib/subscription/service";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { getVerifiedMidtransPayment } from "@/lib/midtrans-status";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/subscription/service", () => ({
  getLatestPendingPayment: vi.fn(),
  activateSubscription: vi.fn(),
  syncUserPremiumStatus: vi.fn(),
}));

const mockGetAuthId = vi.mocked(getAuthenticatedUserIdFromRequest);
const mockGetLatestPendingPayment = vi.mocked(getLatestPendingPayment);
const mockActivateSubscription = vi.mocked(activateSubscription);
const mockSyncUserPremiumStatus = vi.mocked(syncUserPremiumStatus);
const mockPaymentFindUnique = vi.mocked(prisma.payment.findUnique);
const mockPaymentUpdate = vi.mocked(prisma.payment.update);

// Helper buat buat signature Midtrans yang valid
function makeMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey = "",
) {
  return crypto
    .createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
}

describe("Midtrans status verification", () => {
  beforeEach(() => {
    vi.stubEnv("MIDTRANS_SERVER_KEY", "test-server-key");
    vi.stubEnv("MIDTRANS_IS_PRODUCTION", "false");
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const status = (patch: Record<string, unknown> = {}) => ({
    order_id: "TT-verified",
    gross_amount: "59000.00",
    status_code: "200",
    transaction_status: "settlement",
    fraud_status: "accept",
    payment_type: "bank_transfer",
    currency: "IDR",
    ...patch,
  });
  const respond = (body: unknown) =>
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(body))),
    );

  it("memverifikasi status dan nominal melalui endpoint server Midtrans", async () => {
    respond(status());
    expect(await getVerifiedMidtransPayment("TT-verified", 59000)).toEqual({
      paymentType: "bank_transfer",
      vaNumber: null,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.sandbox.midtrans.com/v2/TT-verified/status",
      expect.objectContaining({
        cache: "no-store",
        headers: expect.objectContaining({
          Authorization:
            "Basic " + Buffer.from("test-server-key:").toString("base64"),
        }),
      }),
    );
  });
  it.each([
    { transaction_status: "pending", status_code: "201" },
    { transaction_status: "capture", fraud_status: "challenge" },
    { transaction_status: "deny" },
  ])(
    "tidak menganggap status non-final sebagai pembayaran berhasil",
    async (patch) => {
      respond(status(patch));
      expect(await getVerifiedMidtransPayment("TT-verified", 59000)).toBeNull();
    },
  );
  it.each([
    { order_id: "another-order" },
    { gross_amount: "1.00" },
    { currency: "USD" },
  ])(
    "menolak bukti pembayaran yang tidak cocok dengan transaksi lokal",
    async (patch) => {
      respond(status(patch));
      await expect(
        getVerifiedMidtransPayment("TT-verified", 59000),
      ).rejects.toThrow("MIDTRANS_STATUS_MISMATCH");
    },
  );
  it("gagal aman saat provider tidak tersedia", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 })),
    );
    await expect(
      getVerifiedMidtransPayment("TT-verified", 59000),
    ).rejects.toThrow("MIDTRANS_STATUS_UNAVAILABLE");
  });
});

describe("Payment API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) =>
      fn(prisma as unknown as Prisma.TransactionClient),
    );
    vi.mocked(prisma.$queryRaw).mockResolvedValue([]);
    mockPaymentUpdate.mockResolvedValue({} as never);
  });

  // --------------------------
  // POST /api/payment/cancel
  // --------------------------
  describe("POST /api/payment/cancel", () => {
    beforeEach(() => {
      // Route cek env ini sebelum fetch — harus di-stub agar tidak throw duluan
      vi.stubEnv("MIDTRANS_SERVER_KEY", "test-server-key");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("Harus return 401 jika belum login", async () => {
      mockGetAuthId.mockResolvedValue(null);

      const req = new Request("http://localhost/api/payment/cancel", {
        method: "POST",
      });
      const res = await POST_CANCEL(req);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("Harus return 404 jika tidak ada pembayaran pending", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockGetLatestPendingPayment.mockResolvedValue(null);

      const req = new Request("http://localhost/api/payment/cancel", {
        method: "POST",
      });
      const res = await POST_CANCEL(req);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Tidak ada pembayaran tertunda.");
    });

    it("Harus berhasil cancel dan return data pembayaran yang dibatalkan", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockGetLatestPendingPayment.mockResolvedValue({
        id: "pay-1",
        orderId: "TT-user1-001",
        grossAmount: 59000,
        status: "pending",
        snapToken: "snap-token-abc",
        durationMonths: 1,
        createdAt: new Date(),
      } as never);

      // Mock global fetch untuk Midtrans cancel API
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, status: 200 } as Response);

      const req = new Request("http://localhost/api/payment/cancel", {
        method: "POST",
      });
      const res = await POST_CANCEL(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.cancelledPayment.id).toBe("pay-1");
      expect(json.cancelledPayment.orderId).toBe("TT-user1-001");
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "pay-1" },
          data: expect.objectContaining({ status: "cancel" }),
        }),
      );
    });

    it("Harus tetap cancel payment meski Midtrans return 404 (sudah expired di sana)", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockGetLatestPendingPayment.mockResolvedValue({
        id: "pay-2",
        orderId: "TT-user1-002",
        grossAmount: 59000,
        status: "pending",
        snapToken: "snap-token-xyz",
        durationMonths: 1,
        createdAt: new Date(),
      } as never);

      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 404 } as Response);

      const req = new Request("http://localhost/api/payment/cancel", {
        method: "POST",
      });
      const res = await POST_CANCEL(req);

      // 404 dari Midtrans = dianggap sudah tidak ada, cancel tetap jalan
      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).toHaveBeenCalled();
    });

    it("Harus return 500 jika Midtrans cancel gagal", async () => {
      mockGetAuthId.mockResolvedValue("user1");
      mockGetLatestPendingPayment.mockResolvedValue({
        id: "pay-3",
        orderId: "TT-user1-003",
        grossAmount: 59000,
        status: "pending",
        snapToken: "snap-token-err",
        durationMonths: 1,
        createdAt: new Date(),
      } as never);

      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: false, status: 500 } as Response);

      const req = new Request("http://localhost/api/payment/cancel", {
        method: "POST",
      });
      const res = await POST_CANCEL(req);

      expect(res.status).toBe(500);
    });
  });

  // --------------------------------
  // POST /api/payment/notification
  // --------------------------------
  describe("POST /api/payment/notification", () => {
    beforeEach(() => vi.stubEnv("MIDTRANS_SERVER_KEY", "test-server-key"));
    afterEach(() => vi.unstubAllEnvs());
    const orderId = "TT-user1-001";
    const statusCode = "200";
    const grossAmount = "59000.00";
    const validSignature = makeMidtransSignature(
      orderId,
      statusCode,
      grossAmount,
      "test-server-key",
    );

    const basePayment = {
      id: "pay-1",
      userId: "user1",
      orderId,
      durationMonths: 1,
      grossAmount: Number(grossAmount),
      paidAt: null,
      status: "pending",
      expiredAt: null,
    };

    const settledRequest = (overrides: Record<string, unknown> = {}) =>
      new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "settlement",
          fraud_status: "accept",
          ...overrides,
        }),
      });

    it("memproses ulang settlement lama yang belum membentuk subscription", async () => {
      const paidAt = new Date("2026-11-19T10:00:00Z");
      mockPaymentFindUnique.mockResolvedValue({
        ...basePayment,
        status: "settlement",
        paidAt,
      } as never);
      expect((await POST_NOTIFICATION(settledRequest())).status).toBe(200);
      expect(mockActivateSubscription).toHaveBeenCalledWith(
        { userId: "user1", paymentId: "pay-1", durationMonths: 1, paidAt },
        expect.objectContaining({ payment: expect.any(Object) }),
      );
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ paidAt }) }),
      );
    });

    it("tidak melaporkan sukses jika aktivasi gagal dalam transaksi pembayaran", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);
      mockActivateSubscription.mockRejectedValueOnce(
        new Error("Activation failed"),
      );
      const log = vi.spyOn(console, "error").mockImplementation(() => {});
      expect((await POST_NOTIFICATION(settledRequest())).status).toBe(500);
      expect(prisma.$transaction).toHaveBeenCalledOnce();
      log.mockRestore();
    });

    it("menolak nominal yang berbeda meskipun signature valid", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);
      const amount = "1.00";
      expect(
        (
          await POST_NOTIFICATION(
            settledRequest({
              gross_amount: amount,
              signature_key: makeMidtransSignature(
                orderId,
                statusCode,
                amount,
                "test-server-key",
              ),
            }),
          )
        ).status,
      ).toBe(400);
      expect(mockPaymentUpdate).not.toHaveBeenCalled();
      expect(mockActivateSubscription).not.toHaveBeenCalled();
    });

    it("gagal aman jika server key tidak dikonfigurasi", async () => {
      vi.stubEnv("MIDTRANS_SERVER_KEY", "");
      expect((await POST_NOTIFICATION(settledRequest())).status).toBe(503);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("Harus return 403 jika signature tidak valid", async () => {
      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: "invalid-signature",
          transaction_status: "settlement",
          fraud_status: "accept",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe("Invalid signature");
    });

    it("Harus return 404 jika payment tidak ditemukan di database", async () => {
      mockPaymentFindUnique.mockResolvedValue(null);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "settlement",
          fraud_status: "accept",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(404);
    });

    it("Harus aktivasi subscription jika transaction_status = settlement", async () => {
      mockPaymentFindUnique.mockResolvedValue({
        ...basePayment,
        status: "pending",
      } as never);
      mockActivateSubscription.mockResolvedValue({} as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "settlement",
          fraud_status: "accept",
          payment_type: "bank_transfer",
          va_numbers: [{ va_number: "1234567890" }],
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "settlement" }),
        }),
      );
      expect(mockActivateSubscription).toHaveBeenCalledWith(
        {
          userId: "user1",
          paymentId: "pay-1",
          durationMonths: 1,
          paidAt: expect.any(Date),
        },
        expect.objectContaining({ payment: expect.any(Object) }),
      );
    });

    it("Harus aktivasi subscription jika transaction_status = capture dan fraud_status = accept", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);
      mockActivateSubscription.mockResolvedValue({} as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "capture",
          fraud_status: "accept",
          payment_type: "credit_card",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockActivateSubscription).toHaveBeenCalled();
    });

    it("Harus set status challenge jika capture tapi fraud_status bukan accept", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "capture",
          fraud_status: "challenge",
          payment_type: "credit_card",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "challenge" }),
        }),
      );
      expect(mockActivateSubscription).not.toHaveBeenCalled();
    });

    it("Harus update status cancel dan sync premium jika transaction_status = cancel", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);
      mockSyncUserPremiumStatus.mockResolvedValue({} as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "cancel",
          fraud_status: "accept",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "cancel" }),
        }),
      );
      expect(mockSyncUserPremiumStatus).toHaveBeenCalledWith(
        "user1",
        expect.objectContaining({ payment: expect.any(Object) }),
      );
    });

    it("Harus update status expire dan sync premium jika transaction_status = expire", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);
      mockSyncUserPremiumStatus.mockResolvedValue({} as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "expire",
          fraud_status: "accept",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "expire",
            expiredAt: expect.any(Date),
          }),
        }),
      );
      expect(mockSyncUserPremiumStatus).toHaveBeenCalledWith(
        "user1",
        expect.objectContaining({ payment: expect.any(Object) }),
      );
    });

    it("Harus update status pending jika transaction_status = pending", async () => {
      mockPaymentFindUnique.mockResolvedValue({ ...basePayment } as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "pending",
          fraud_status: "accept",
          payment_type: "bank_transfer",
          va_numbers: [{ va_number: "9876543210" }],
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "pending",
            vaNumber: "9876543210",
          }),
        }),
      );
    });

    it("Harus idempotent — skip jika payment sudah settlement dan incoming bukan settlement/capture", async () => {
      mockPaymentFindUnique.mockResolvedValue({
        ...basePayment,
        status: "settlement",
      } as never);

      const req = new Request("http://localhost/api/payment/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          status_code: statusCode,
          gross_amount: grossAmount,
          signature_key: validSignature,
          transaction_status: "cancel",
          fraud_status: "accept",
        }),
      });
      const res = await POST_NOTIFICATION(req);

      expect(res.status).toBe(200);
      expect(mockPaymentUpdate).not.toHaveBeenCalled();
      expect(mockActivateSubscription).not.toHaveBeenCalled();
    });
  });
});
