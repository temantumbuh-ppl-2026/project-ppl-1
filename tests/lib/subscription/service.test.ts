import type { Prisma } from "@/app/generated/prisma/client";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getLatestPendingPayment,
  activateSubscription,
  syncUserPremiumStatus,
  getSubscriptionStatus,
} from "@/lib/subscription/service";
import prisma from "@/lib/prisma";
import { getVerifiedMidtransPayment } from "@/lib/midtrans-status";

vi.mock("@/lib/midtrans-status", () => ({
  getVerifiedMidtransPayment: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    payment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const mockPaymentFindFirst = vi.mocked(prisma.payment.findFirst);
const mockTransaction = vi.mocked(prisma.$transaction);

function runTransaction(
  callback: (tx: Prisma.TransactionClient) => Promise<unknown>,
  tx: object,
) {
  return callback({
    $queryRaw: vi.fn().mockResolvedValue([{ id: "user1" }]),
    ...tx,
  } as unknown as Prisma.TransactionClient);
}

describe("lib/subscription/service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.payment.findMany).mockResolvedValue([]);
  });

  // ─────────────────────────────────────
  // getLatestPendingPayment
  // ─────────────────────────────────────
  describe("getLatestPendingPayment", () => {
    it("Harus return payment jika ada pending payment", async () => {
      const mockPayment = {
        id: "pay-1",
        orderId: "TT-001",
        grossAmount: 59000,
        status: "pending",
        snapToken: "snap-abc",
        durationMonths: 1,
        createdAt: new Date(),
      };
      mockPaymentFindFirst.mockResolvedValue(mockPayment as never);

      const result = await getLatestPendingPayment("user1");

      expect(result).toEqual(mockPayment);
      expect(mockPaymentFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user1",
            status: { in: ["pending", "challenge"] },
            snapToken: { not: null },
          }),
        }),
      );
    });

    it("Harus return null jika tidak ada pending payment", async () => {
      mockPaymentFindFirst.mockResolvedValue(null);

      const result = await getLatestPendingPayment("user1");

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────────
  // activateSubscription
  // ─────────────────────────────────────
  describe("activateSubscription", () => {
    it("tidak mengaktifkan ulang paket historis yang sudah melewati durasinya", async () => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: "user1" }]),
        subscription: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "historical" }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        user: { update: vi.fn().mockResolvedValue({}) },
      };
      await activateSubscription(
        {
          userId: "user1",
          paymentId: "old-payment",
          durationMonths: 1,
          paidAt: new Date("2020-01-01T00:00:00Z"),
        },
        tx as unknown as Prisma.TransactionClient,
      );
      expect(tx.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startedAt: new Date("2020-01-01T00:00:00Z"),
          expiresAt: new Date("2020-02-01T00:00:00Z"),
          isActive: false,
        }),
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { isPremium: false },
      });
    });
    it("retry pembayaran yang sama tidak membuat atau memperpanjang subscription lagi", async () => {
      const existing = {
        id: "sub-existing",
        userId: "user1",
        paymentId: "pay-1",
        isActive: false,
      };
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: "user1" }]),
        subscription: {
          findFirst: vi.fn().mockResolvedValue(existing),
          create: vi.fn(),
          updateMany: vi.fn(),
        },
        user: { update: vi.fn() },
      };
      const result = await activateSubscription(
        { userId: "user1", paymentId: "pay-1", durationMonths: 1 },
        tx as unknown as Prisma.TransactionClient,
      );
      expect(result).toBe(existing);
      expect(tx.subscription.create).not.toHaveBeenCalled();
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("memakai transaksi caller untuk menyimpan subscription dan premium", async () => {
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([{ id: "user1" }]),
        subscription: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: "sub-1" }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
        user: { update: vi.fn().mockResolvedValue({}) },
      };
      await activateSubscription(
        { userId: "user1", paymentId: "pay-1", durationMonths: 1 },
        tx as unknown as Prisma.TransactionClient,
      );
      expect(tx.subscription.create).toHaveBeenCalledOnce();
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { isPremium: true },
      });
      expect(mockTransaction).not.toHaveBeenCalled();
    });
    it("Harus buat subscription baru mulai dari sekarang jika tidak ada active sub", async () => {
      const mockSub = { id: "sub-1", isActive: true };

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null), // tidak ada active sub
            create: vi.fn().mockResolvedValue(mockSub),
          },
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return runTransaction(fn, tx);
      });

      const result = await activateSubscription({
        userId: "user1",
        paymentId: "pay-1",
        durationMonths: 1,
      });

      expect(result).toEqual(mockSub);
    });

    it("Harus append subscription setelah active sub yang ada (renewal)", async () => {
      const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 hari ke depan
      const mockSub = { id: "sub-2", isActive: true };

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValue({ expiresAt: futureExpiry }), // ada active sub
            create: vi.fn().mockResolvedValue(mockSub),
          },
          user: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return runTransaction(fn, tx);
      });

      const result = await activateSubscription({
        userId: "user1",
        paymentId: "pay-2",
        durationMonths: 3,
      });

      expect(result).toEqual(mockSub);
    });

    it("Harus set isPremium = true di user setelah aktivasi", async () => {
      const mockUserUpdate = vi.fn().mockResolvedValue({});

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "sub-1" }),
          },
          user: { update: mockUserUpdate },
        };
        return runTransaction(fn, tx);
      });

      await activateSubscription({
        userId: "user1",
        paymentId: "pay-1",
        durationMonths: 1,
      });

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user1" },
          data: { isPremium: true },
        }),
      );
    });
  });

  // ─────────────────────────────────────
  // syncUserPremiumStatus
  // ─────────────────────────────────────
  describe("syncUserPremiumStatus", () => {
    it("memulihkan pembayaran terverifikasi sebelum menentukan akses premium", async () => {
      const payment = {
        id: "paid-1",
        orderId: "TT-paid-1",
        userId: "user1",
        grossAmount: 59000,
        status: "settlement",
        durationMonths: 1,
        paidAt: new Date(),
        paymentType: null,
        vaNumber: null,
      };
      vi.mocked(prisma.payment.findMany).mockResolvedValue([payment] as never);
      vi.mocked(getVerifiedMidtransPayment).mockResolvedValue({
        paymentType: "bank_transfer",
        vaNumber: null,
      });
      let created = false;
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        payment: {
          findUnique: vi.fn().mockResolvedValue(payment),
          update: vi.fn().mockResolvedValue(payment),
        },
        subscription: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockImplementation(async () => {
            created = true;
            return { id: "sub-recovered" };
          }),
          findMany: vi.fn().mockImplementation(async () =>
            created
              ? [
                  {
                    id: "sub-recovered",
                    isActive: true,
                    startedAt: new Date(Date.now() - 1000),
                    expiresAt: new Date(Date.now() + 86400000),
                  },
                ]
              : [],
          ),
        },
        user: { update: vi.fn().mockResolvedValue({}) },
      };
      mockTransaction.mockImplementation(async (fn) => runTransaction(fn, tx));
      expect((await syncUserPremiumStatus("user1")).isPremium).toBe(true);
      expect(getVerifiedMidtransPayment).toHaveBeenCalledWith(
        payment.orderId,
        59000,
      );
      expect(tx.subscription.create).toHaveBeenCalledOnce();
    });

    it("tidak memberi premium hanya karena ada checkout yang belum dibayar", async () => {
      vi.mocked(prisma.payment.findMany).mockResolvedValue([
        { id: "pending-1", orderId: "TT-pending", grossAmount: 59000 },
      ] as never);
      vi.mocked(getVerifiedMidtransPayment).mockResolvedValue(null);
      const create = vi.fn();
      mockTransaction.mockImplementation(async (fn) =>
        runTransaction(fn, {
          subscription: {
            updateMany: vi.fn(),
            findMany: vi.fn().mockResolvedValue([]),
            create,
          },
          user: { update: vi.fn() },
        }),
      );
      expect((await syncUserPremiumStatus("user1")).isPremium).toBe(false);
      expect(create).not.toHaveBeenCalled();
    });

    it("gangguan verifikasi tidak menghilangkan akses premium yang masih aktif", async () => {
      vi.mocked(prisma.payment.findMany).mockResolvedValue([
        { id: "pending-1", orderId: "TT-pending", grossAmount: 59000 },
      ] as never);
      vi.mocked(getVerifiedMidtransPayment).mockRejectedValue(
        new Error("Provider unavailable"),
      );
      const log = vi.spyOn(console, "warn").mockImplementation(() => {});
      mockTransaction.mockImplementation(async (fn) =>
        runTransaction(fn, {
          subscription: {
            updateMany: vi.fn(),
            findMany: vi.fn().mockResolvedValue([
              {
                id: "active",
                startedAt: new Date(Date.now() - 1000),
                expiresAt: new Date(Date.now() + 86400000),
              },
            ]),
          },
          user: { update: vi.fn() },
        }),
      );
      expect((await syncUserPremiumStatus("user1")).isPremium).toBe(true);
      log.mockRestore();
    });
    it("Harus return isPremium: true jika ada active subscription", async () => {
      const now = new Date();
      const activeSub = {
        id: "sub-1",
        startedAt: new Date(now.getTime() - 1000),
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      };

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([activeSub]),
          },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return runTransaction(fn, tx);
      });

      const result = await syncUserPremiumStatus("user1");

      expect(result.isPremium).toBe(true);
      expect(result.subscription).toEqual(activeSub);
      expect(result.activeSubscriptionCount).toBe(1);
    });

    it("Harus return isPremium: false jika tidak ada active subscription", async () => {
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]), // tidak ada
          },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return runTransaction(fn, tx);
      });

      const result = await syncUserPremiumStatus("user1");

      expect(result.isPremium).toBe(false);
      expect(result.subscription).toBeNull();
      expect(result.premiumUntil).toBeNull();
      expect(result.activeSubscriptionCount).toBe(0);
    });

    it("Harus update user.isPremium = false jika tidak ada active sub", async () => {
      const mockUserUpdate = vi.fn().mockResolvedValue({});

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]),
          },
          user: { update: mockUserUpdate },
        };
        return runTransaction(fn, tx);
      });

      await syncUserPremiumStatus("user1");

      expect(mockUserUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isPremium: false },
        }),
      );
    });

    it("Harus deactivate expired subscriptions (updateMany dengan lte: now)", async () => {
      const mockSubUpdateMany = vi.fn().mockResolvedValue({ count: 1 });

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: mockSubUpdateMany,
            findMany: vi.fn().mockResolvedValue([]),
          },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return runTransaction(fn, tx);
      });

      await syncUserPremiumStatus("user1");

      expect(mockSubUpdateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: "user1",
            isActive: true,
          }),
          data: { isActive: false },
        }),
      );
    });
  });

  // ─────────────────────────────────────
  // getSubscriptionStatus
  // ─────────────────────────────────────
  describe("getSubscriptionStatus", () => {
    it("Harus return status lengkap dengan canRenew: true jika tidak ada pending payment", async () => {
      const now = new Date();
      const activeSub = {
        id: "sub-1",
        startedAt: new Date(now.getTime() - 1000),
        expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      };

      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([activeSub]),
          },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return runTransaction(fn, tx);
      });
      mockPaymentFindFirst.mockResolvedValue(null); // tidak ada pending

      const result = await getSubscriptionStatus("user1");

      expect(result.isPremium).toBe(true);
      expect(result.canRenew).toBe(true);
      expect(result.pendingPayment).toBeNull();
      expect(result.subscription).not.toBeNull();
    });

    it("Harus return canRenew: false jika ada pending payment", async () => {
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]),
          },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return runTransaction(fn, tx);
      });
      mockPaymentFindFirst.mockResolvedValue({
        id: "pay-1",
        status: "pending",
      } as never);

      const result = await getSubscriptionStatus("user1");

      expect(result.isPremium).toBe(false);
      expect(result.canRenew).toBe(false);
      expect(result.pendingPayment).not.toBeNull();
    });

    it("Harus return subscription: null jika tidak premium", async () => {
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {
          subscription: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            findMany: vi.fn().mockResolvedValue([]),
          },
          user: { update: vi.fn().mockResolvedValue({}) },
        };
        return runTransaction(fn, tx);
      });
      mockPaymentFindFirst.mockResolvedValue(null);

      const result = await getSubscriptionStatus("user1");

      expect(result.subscription).toBeNull();
    });
  });
});
