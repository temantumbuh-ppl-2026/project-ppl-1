/** Reads authoritative payment status without creating or charging a transaction. */
export async function getVerifiedMidtransPayment(
  orderId: string,
  amount: number,
) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_NOT_CONFIGURED");
  const baseUrl =
    process.env.MIDTRANS_IS_PRODUCTION === "true"
      ? "https://api.midtrans.com"
      : "https://api.sandbox.midtrans.com";
  const response = await fetch(
    `${baseUrl}/v2/${encodeURIComponent(orderId)}/status`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!response.ok) throw new Error("MIDTRANS_STATUS_UNAVAILABLE");
  const result = await response.json();
  if (
    !result ||
    result.order_id !== orderId ||
    !Number.isFinite(Number(result.gross_amount)) ||
    Number(result.gross_amount) !== amount ||
    (result.currency && result.currency !== "IDR")
  ) {
    throw new Error("MIDTRANS_STATUS_MISMATCH");
  }
  const paid =
    String(result.status_code) === "200" &&
    (result.transaction_status === "settlement" ||
      (result.transaction_status === "capture" &&
        result.fraud_status === "accept")) &&
    (result.fraud_status == null || result.fraud_status === "accept");
  if (!paid) return null;
  return {
    paymentType:
      typeof result.payment_type === "string" ? result.payment_type : null,
    vaNumber:
      Array.isArray(result.va_numbers) &&
      typeof result.va_numbers[0]?.va_number === "string"
        ? result.va_numbers[0].va_number
        : null,
  };
}
