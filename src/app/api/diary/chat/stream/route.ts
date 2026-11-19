import { NextResponse } from "next/server";

import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { generateDiaryAssistantReplyStream } from "@/lib/diary/litellm";
import {
  DiaryServiceError,
  persistDiaryChatSession,
  prepareDiaryChatSession,
  toDiaryServiceErrorForAiFailure,
} from "@/lib/diary/service";
import { diaryChatPayloadSchema } from "@/lib/diary/validation";

const encoder = new TextEncoder();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/diary/chat/stream
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

    const session = await prepareDiaryChatSession({
      userId,
      entryId: parsedPayload.data.entryId,
      messageText: parsedPayload.data.messageText,
      timezone: parsedPayload.data.timezone,
    });

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let assistantText = "";

        try {
          for await (const textChunk of generateDiaryAssistantReplyStream({
            messages: session.promptMessages,
          })) {
            assistantText += textChunk;
            controller.enqueue(toSseChunk("chunk", { text: textChunk }));
          }

          const result = await persistDiaryChatSession({
            session,
            assistantText,
          });

          controller.enqueue(toSseChunk("done", result));
        } catch (error) {
          console.error("Diary chat stream error:", error);

          const serviceError =
            error instanceof DiaryServiceError
              ? error
              : toDiaryServiceErrorForAiFailure(error);

          controller.enqueue(
            toSseChunk("error", {
              error: serviceError.message,
              code: serviceError.code,
              status: serviceError.status,
            }),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Diary chat stream POST error:", error);

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
      { error: "Terjadi kesalahan saat memproses chat diary stream." },
      { status: 500 },
    );
  }
}

function toSseChunk(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
