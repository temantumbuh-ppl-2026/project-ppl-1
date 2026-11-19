import type { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import { getVerifiedMidtransPayment } from "@/lib/midtrans-status";

const PENDING_PAYMENT_STATUSES = ["pending", "challenge"];

function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

async function lockSubscriptionUser(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  // Serializes renewals and premium checks for this account.
  await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${userId} FOR UPDATE`;
}

export async function getLatestPendingPayment(userId: string) {
  return prisma.payment.findFirst({
    where: {
      userId,
      status: { in: PENDING_PAYMENT_STATUSES },
      snapToken: { not: null },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderId: true,
      grossAmount: true,
      status: true,
      snapToken: true,
      durationMonths: true,
      createdAt: true,
    },
  });
}

/**
 * Creates a subscription once per payment and updates current premium access.
 * Renewals are appended after the user's furthest active expiry so remaining
 * premium time is preserved.
 */
export async function activateSubscription(
  {
    userId,
    paymentId,
    durationMonths,
    paidAt,
  }: {
    userId: string;
    paymentId: string;
    durationMonths: number;
    paidAt?: Date;
  },
  transaction?: Prisma.TransactionClient,
) {
  const now = new Date();
  const activate = async (tx: Prisma.TransactionClient) => {
    await lockSubscriptionUser(tx, userId);
    const existing = await tx.subscription.findFirst({ where: { paymentId } });
    if (existing) return existing;
    await tx.subscription.updateMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { lte: now },
      },
      data: { isActive: false },
    });

    const furthestActiveSubscription = await tx.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    const paymentDate = paidAt ?? now;
    // A late replay must not turn an already expired purchase into a new package.
    const historicalExpired = addMonths(paymentDate, durationMonths) <= now;
    const startedAt =
      !historicalExpired &&
      furthestActiveSubscription &&
      furthestActiveSubscription.expiresAt > paymentDate
        ? furthestActiveSubscription.expiresAt
        : paymentDate;
    const expiresAt = addMonths(startedAt, durationMonths);

    const subscription = await tx.subscription.create({
      data: {
        userId,
        paymentId,
        startedAt,
        expiresAt,
        isActive: expiresAt > now,
      },
    });

    const currentAccess =
      (startedAt <= now && expiresAt > now) ||
      Boolean(
        await tx.subscription.findFirst({
          where: {
            userId,
            isActive: true,
            startedAt: { lte: now },
            expiresAt: { gt: now },
          },
        }),
      );
    await tx.user.update({
      where: { id: userId },
      data: { isPremium: currentAccess },
    });

    return subscription;
  };
  return transaction ? activate(transaction) : prisma.$transaction(activate);
}

/**
 * Deactivates expired rows, recalculates current premium access from all
 * subscription rows, and mirrors the result into user.isPremium.
 */
export async function syncUserPremiumStatus(
  userId: string,
  transaction?: Prisma.TransactionClient,
) {
  // A browser's success URL is not payment evidence. Reconcile missing
  // entitlements using an authenticated provider query, outside the DB lock.
  if (!transaction) await reconcileUserPayments(userId);
  const now = new Date();

  const sync = async (tx: Prisma.TransactionClient) => {
    await lockSubscriptionUser(tx, userId);
    await tx.subscription.updateMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { lte: now },
      },
      data: { isActive: false },
    });

    const activeSubscriptions = await tx.subscription.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    const currentSubscription =
      activeSubscriptions.find(
        (subscription) =>
          subscription.startedAt <= now && subscription.expiresAt > now,
      ) ?? null;

    const premiumUntil = activeSubscriptions[0]?.expiresAt ?? null;
    const isPremium = currentSubscription !== null;

    await tx.user.update({
      where: { id: userId },
      data: { isPremium },
    });

    return {
      isPremium,
      subscription: activeSubscriptions[0] ?? null,
      premiumUntil,
      activeSubscriptionCount: activeSubscriptions.length,
    };
  };
  return transaction ? sync(transaction) : prisma.$transaction(sync);
}

async function reconcileUserPayments(userId: string) {
  const payments = await prisma.payment.findMany({
    where: {
      userId,
      status: { in: ["pending", "challenge", "settlement"] },
      snapToken: { not: null },
      subscriptions: { none: {} },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, orderId: true, grossAmount: true },
  });
  const verified = await Promise.allSettled(
    payments.reverse().map(async (payment) => ({
      payment,
      status: await getVerifiedMidtransPayment(
        payment.orderId,
        Number(payment.grossAmount),
      ),
    })),
  );
  for (const result of verified) {
    if (result.status === "rejected") {
      console.warn("Payment status reconciliation unavailable.", {
        code: "MIDTRANS_RECONCILIATION_FAILED",
      });
      continue;
    }
    const { payment, status } = result.value;
    if (!status) continue;
    await prisma.$transaction(async (tx) => {
      await lockSubscriptionUser(tx, userId);
      await tx.$queryRaw`SELECT "id" FROM "payment" WHERE "id" = ${payment.id} FOR UPDATE`;
      const current = await tx.payment.findUnique({
        where: { id: payment.id },
      });
      if (
        !current ||
        current.userId !== userId ||
        current.orderId !== payment.orderId ||
        Number(current.grossAmount) !== Number(payment.grossAmount) ||
        !["pending", "challenge", "settlement"].includes(current.status)
      )
        return;
      const paidAt = current.paidAt ?? new Date();
      await tx.payment.update({
        where: { id: current.id },
        data: {
          status: "settlement",
          paidAt,
          paymentType: status.paymentType ?? current.paymentType,
          vaNumber: status.vaNumber ?? current.vaNumber,
        },
      });
      await activateSubscription(
        {
          userId,
          paymentId: current.id,
          durationMonths: current.durationMonths,
          paidAt,
        },
        tx,
      );
    });
  }
}

/**
 * Gets current subscription status for a user, with auto-downgrade check.
 */
export async function getSubscriptionStatus(userId: string) {
  const result = await syncUserPremiumStatus(userId);
  const pendingPayment = await getLatestPendingPayment(userId);

  const canRenew = pendingPayment === null;

  return {
    isPremium: result.isPremium,
    subscription: result.subscription
      ? {
          id: result.subscription.id,
          startedAt: result.subscription.startedAt,
          expiresAt: result.subscription.expiresAt,
          isActive: result.subscription.isActive,
        }
      : null,
    activeSubscriptionCount: result.activeSubscriptionCount,
    premiumUntil: result.premiumUntil,
    pendingPayment,
    canRenew,
  };
}

export const checkAndDowngradeExpiredSubscription = syncUserPremiumStatus;
