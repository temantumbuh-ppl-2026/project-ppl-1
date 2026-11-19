import { NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { diaryConversationStarters } from "@/lib/diary/starters";

/** GET /api/diary/chat/starters */
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: { starters: diaryConversationStarters },
    });
  } catch {
    console.error("Diary starters GET error:");
    return NextResponse.json(
      { error: "Gagal memuat pilihan awal cerita." },
      { status: 500 },
    );
  }
}
