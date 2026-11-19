import { NextResponse } from "next/server";
import { AdminAccessError } from "@/lib/admin/authorization";
import { EncryptionError } from "@/lib/encryption";
import { SafetyAlertError } from "./service";

const privateHeaders = { "Cache-Control": "private, no-store" };

export function safetyJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}

export function safetyErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError)
    return safetyJson({ error: error.message }, error.status);
  if (error instanceof SafetyAlertError)
    return safetyJson({ error: error.message, code: error.code }, error.status);
  if (error instanceof EncryptionError)
    return safetyJson(
      {
        error: "Data review sedang tidak tersedia.",
        code: "SAFETY_ENCRYPTION_UNAVAILABLE",
      },
      503,
    );
  console.error("Admin safety API failed.", { code: "SAFETY_INTERNAL_ERROR" });
  return safetyJson(
    {
      error: "Monitoring safety sedang tidak tersedia.",
      code: "SAFETY_INTERNAL_ERROR",
    },
    500,
  );
}
