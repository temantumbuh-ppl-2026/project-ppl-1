import { NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import {
  DiaryServiceError,
  listDiaryMessagesByEntryId,
} from "@/lib/diary/service";
import { diaryMessagesQuerySchema } from "@/lib/diary/validation";

type RouteContext = {
  params: Promise<{
    entryId: string;
  }>;
};

/**
 * GET /api/diary/:entryId/messages?timezone=Asia/Jakarta
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entryId } = await context.params;
    const { searchParams } = new URL(request.url);

    const parsedQuery = diaryMessagesQuerySchema.safeParse({
      timezone: searchParams.get("timezone") || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error:
            parsedQuery.error.issues[0]?.message ||
            "Parameter query diary tidak valid.",
        },
        { status: 400 },
      );
    }

    const messages = await listDiaryMessagesByEntryId({
      userId,
      entryId,
      timezone: parsedQuery.data.timezone,
    });

    return NextResponse.json({
      success: true,
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error("Diary messages GET error:", error);

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
      { error: "Terjadi kesalahan saat mengambil percakapan diary." },
      { status: 500 },
    );
  }
}
