import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  activateSubscription,
  syncUserPremiumStatus,
} from "@/lib/subscription/service";

/** Persists the payment and its entitlement together, including notification retries. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      va_numbers,
    } = body;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey)
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503 },
      );
    const expectedSignature = crypto
      .createHash("sha512")
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest("hex");
    if (
      typeof signature_key !== "string" ||
      !/^[0-9a-f]{128}$/i.test(signature_key) ||
      !crypto.timingSafeEqual(
        Buffer.from(signature_key, "hex"),
        Buffer.from(expectedSignature, "hex"),
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    return await prisma.$transaction(async (tx) => {
      let payment = await tx.payment.findUnique({
        where: { orderId: order_id },
      });
      if (!payment)
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 },
        );
      // Lock account first, matching subscription activation and premium checks.
      await tx.$queryRaw`SELECT "id" FROM "user" WHERE "id" = ${payment.userId} FOR UPDATE`;
      await tx.$queryRaw`SELECT "id" FROM "payment" WHERE "id" = ${payment.id} FOR UPDATE`;
      payment = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!payment)
        return NextResponse.json(
          { error: "Payment not found" },
          { status: 404 },
        );
      if (
        !Number.isFinite(Number(gross_amount)) ||
        Number(gross_amount) !== Number(payment.grossAmount)
      ) {
        return NextResponse.json(
          { error: "Payment amount mismatch" },
          { status: 400 },
        );
      }
      const successful =
        String(status_code) === "200" &&
        (transaction_status === "settlement" ||
          (transaction_status === "capture" && fraud_status === "accept")) &&
        (fraud_status === undefined || fraud_status === "accept");
      if (payment.status === "settlement" && !successful)
        return NextResponse.json({ success: true });
      const vaNumber =
        Array.isArray(va_numbers) && va_numbers.length
          ? va_numbers[0].va_number
          : null;
      if (successful) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "settlement",
            paymentType: payment_type || null,
            vaNumber,
            paidAt: payment.paidAt ?? new Date(),
          },
        });
        // A settled row without a subscription is repaired on retry. Existing
        // subscriptions are returned without extending the duration a second time.
        await activateSubscription(
          {
            userId: payment.userId,
            paymentId: payment.id,
            durationMonths: payment.durationMonths,
            paidAt: payment.paidAt ?? new Date(),
          },
          tx,
        );
      } else if (transaction_status === "capture") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "challenge",
            paymentType: payment_type || null,
            vaNumber,
          },
        });
      } else if (["cancel", "deny", "expire"].includes(transaction_status)) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: transaction_status,
            paymentType: payment_type || null,
            vaNumber,
            expiredAt:
              transaction_status === "expire" ? new Date() : payment.expiredAt,
          },
        });
        await syncUserPremiumStatus(payment.userId, tx);
      } else if (transaction_status === "pending") {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "pending",
            paymentType: payment_type || null,
            vaNumber,
          },
        });
      }
      return NextResponse.json({ success: true });
    });
  } catch (error) {
    console.error("Payment notification failed.", {
      code:
        typeof error === "object" && error !== null && "code" in error
          ? error.code
          : "PAYMENT_NOTIFICATION_FAILED",
    });
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses notifikasi pembayaran." },
      { status: 500 },
    );
  }
}
