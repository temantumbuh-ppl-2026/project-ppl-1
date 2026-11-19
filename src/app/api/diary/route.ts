import { NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import {
  DiaryServiceError,
  listDiaryEntriesByMonth,
} from "@/lib/diary/service";
import { diaryEntriesQuerySchema } from "@/lib/diary/validation";

/**
 * GET /api/diary?month=YYYY-MM&timezone=Asia/Jakarta
 */
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = diaryEntriesQuerySchema.safeParse({
      month: searchParams.get("month") || "",
      timezone: searchParams.get("timezone") || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error:
            parsedQuery.error.issues[0]?.message ||
            "Parameter diary tidak valid.",
        },
        { status: 400 },
      );
    }

    const result = await listDiaryEntriesByMonth({
      userId,
      monthKey: parsedQuery.data.month,
      timezone: parsedQuery.data.timezone,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Diary entries GET error:", error);

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
      { error: "Terjadi kesalahan saat mengambil riwayat diary." },
      { status: 500 },
    );
  }
}
