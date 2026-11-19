import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/diary/chat/starters/route";
import { getAuthenticatedUserIdFromRequest } from "@/lib/auth";
import { diaryChatPayloadSchema } from "@/lib/diary/validation";

vi.mock("@/lib/auth", () => ({
  getAuthenticatedUserIdFromRequest: vi.fn(),
}));

const mockAuth = vi.mocked(getAuthenticatedUserIdFromRequest);

describe("GET /api/diary/chat/starters", () => {
  beforeEach(() => vi.clearAllMocks());

  it("memerlukan autentikasi", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET(
      new Request("http://localhost/api/diary/chat/starters"),
    );

    expect(response.status).toBe(401);
  });

  it("mengembalikan pesan pembuka yang dapat langsung dikirim ke chat", async () => {
    mockAuth.mockResolvedValue("user-1");
    const response = await GET(
      new Request("http://localhost/api/diary/chat/starters"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.starters.length).toBeGreaterThanOrEqual(5);
    expect(
      new Set(
        payload.data.starters.map((starter: { id: string }) => starter.id),
      ).size,
    ).toBe(payload.data.starters.length);
    for (const starter of payload.data.starters) {
      expect(starter.label).toBeTruthy();
      expect(
        diaryChatPayloadSchema.safeParse({
          entryId: "today",
          messageText: starter.messageText,
        }).success,
      ).toBe(true);
    }
  });
});
