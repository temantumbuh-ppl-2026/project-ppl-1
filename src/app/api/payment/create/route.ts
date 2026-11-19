import { NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import snap from "@/lib/midtrans";
import prisma from "@/lib/prisma";
import { getLatestPendingPayment } from "@/lib/subscription/service";

const PRICE_PER_MONTH = 59000;
const ALLOWED_DURATIONS = [1, 3, 6, 12];

/**
 * POST /api/payment/create
 * Creates a Midtrans Snap transaction and returns the snap token.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const durationMonths = Number(payload.durationMonths);

    if (!ALLOWED_DURATIONS.includes(durationMonths)) {
      return NextResponse.json(
        { error: "Durasi tidak valid. Pilih 1, 3, 6, atau 12 bulan." },
        { status: 400 },
      );
    }

    const pendingPayment = await getLatestPendingPayment(userId);

    if (pendingPayment) {
      return NextResponse.json(
        {
          error:
            "Masih ada pembayaran yang sedang diproses. Lanjutkan atau batalkan pembayaran tersebut terlebih dahulu.",
          code: "PENDING_PAYMENT_EXISTS",
          pendingPayment: {
            id: pendingPayment.id,
            orderId: pendingPayment.orderId,
            token: pendingPayment.snapToken,
            durationMonths: pendingPayment.durationMonths,
            grossAmount: pendingPayment.grossAmount.toString(),
            status: pendingPayment.status,
            createdAt: pendingPayment.createdAt,
          },
        },
        { status: 409 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan." },
        { status: 404 },
      );
    }

    const grossAmount = PRICE_PER_MONTH * durationMonths;
    const orderId = `TT-${userId.slice(0, 8)}-${Date.now()}`;

    // Create payment record in DB
    const payment = await prisma.payment.create({
      data: {
        orderId,
        userId,
        grossAmount,
        status: "pending",
        durationMonths,
      },
    });

    // Create Midtrans Snap transaction
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: "premium-subscription",
          price: PRICE_PER_MONTH,
          quantity: durationMonths,
          name: `Premium ${durationMonths} Bulan`,
        },
      ],
      customer_details: {
        first_name: user.name || "User",
        email: user.email,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    // Save snap token to payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: { snapToken: transaction.token },
    });

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
      orderId,
    });
  } catch (error) {
    console.error("Payment create error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat transaksi pembayaran." },
      { status: 500 },
    );
  }
}
