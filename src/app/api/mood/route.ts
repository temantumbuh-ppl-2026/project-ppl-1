import { after, NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { createMoodLog, getMoodLogs } from "@/lib/mood/service";
import {
  ensureDiaryShellFromMood,
  generateDiaryGreetingFromMood,
} from "@/lib/diary/service";
import {
  moodHistoryQuerySchema,
  moodSubmitSchema,
} from "@/lib/mood/validation";

/**
 * GET /api/mood
 * Mengambil histori mood check-in dari pengguna yang sedang login.
 * Menerima query string opsional: `?date=YYYY-MM-DD` & `?timezone=Asia/Jakarta`
 */
export async function GET(request: Request) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = moodHistoryQuerySchema.safeParse({
      date: searchParams.get("date") || undefined,
      timezone: searchParams.get("timezone") || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error:
            parsedQuery.error.issues[0]?.message ||
            "Parameter query mood tidak valid.",
        },
        { status: 400 },
      );
    }

    const logs = await getMoodLogs(
      userId,
      parsedQuery.data.date,
      parsedQuery.data.timezone,
    );

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Mood GET error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil riwayat mood." },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mood
 * Menyimpan data mood check-in untuk pengguna yang sedang login pada hari yang berjalan.
 * Memvalidasi input dan memastikan hanya bisa 1x submit per hari per timezone.
 * Mensinkronisasikan penambahan / pengulangan nilai streak otomatis.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsedPayload = moodSubmitSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error:
            parsedPayload.error.issues[0]?.message ||
            "Payload mood tidak valid.",
        },
        { status: 400 },
      );
    }

    const { newLog, updatedUser } = await createMoodLog({
      userId,
      moodScore: parsedPayload.data.moodScore,
      note: parsedPayload.data.note,
      timezone: parsedPayload.data.timezone,
    });

    const diaryShell = await ensureDiaryShellFromMood({
      userId,
      timezone: parsedPayload.data.timezone,
    });

    if (diaryShell.shouldGenerateGreeting) {
      scheduleAfterResponse(async () => {
        await generateDiaryGreetingFromMood({
          userId,
          moodScore: parsedPayload.data.moodScore,
          notes: parsedPayload.data.note || "",
          diaryId: diaryShell.diaryId,
          todayDate: diaryShell.todayDate,
          timezone: diaryShell.timezone,
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: "Mood berhasil disubmit.",
      data: {
        mood: newLog,
        currentStreak: updatedUser.currentStreak,
        diary: {
          id: diaryShell.diaryId,
          greetingStatus: diaryShell.shouldGenerateGreeting
            ? "scheduled"
            : "ready",
        },
      },
    });
  } catch (error: unknown) {
    console.error("Mood POST error:", error);

    // Mengembalikan pesan spesifik misal error "Kamu sudah mengisi mood check-in hari ini."
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat menyimpan mood.",
      },
      {
        status:
          error instanceof Error && error.message.includes("sudah mengisi")
            ? 409
            : 500,
      },
    );
  }
}

function scheduleAfterResponse(task: () => Promise<void>) {
  const runTask = async () => {
    try {
      await task();
    } catch (error) {
      console.error("Mood diary background task error:", error);
    }
  };

  try {
    after(runTask);
  } catch (error) {
    if (process.env.NODE_ENV === "test") {
      return;
    }

    console.warn("Falling back to in-process diary task scheduling:", error);
    void runTask();
  }
}
