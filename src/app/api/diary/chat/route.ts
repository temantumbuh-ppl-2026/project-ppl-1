import { NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { DiaryServiceError, sendDiaryChatMessage } from "@/lib/diary/service";
import { diaryChatPayloadSchema } from "@/lib/diary/validation";

/**
 * POST /api/diary/chat
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsedPayload = diaryChatPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error:
            parsedPayload.error.issues[0]?.message ||
            "Payload chat diary tidak valid.",
        },
        { status: 400 },
      );
    }

    const result = await sendDiaryChatMessage({
      userId,
      entryId: parsedPayload.data.entryId,
      messageText: parsedPayload.data.messageText,
      timezone: parsedPayload.data.timezone,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Diary chat POST error:", error);

    if (error instanceof DiaryServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status },
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses chat diary." },
      { status: 500 },
    );
  }
}
