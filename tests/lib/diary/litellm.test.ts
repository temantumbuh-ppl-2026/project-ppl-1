import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());
const mockOpenAI = vi.hoisted(() => vi.fn());

vi.mock("openai", () => ({
  default: mockOpenAI,
}));

import {
  generateDiaryAssistantReply,
  generateDiaryAssistantReplyStream,
} from "@/lib/diary/litellm";
import type { DiaryPromptMessage } from "@/lib/diary/prompt";

const messages: DiaryPromptMessage[] = [{ role: "user", content: "Halo" }];

describe("lib/diary/litellm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.API_KEY;
    delete process.env.BASE_URL;
    mockOpenAI.mockImplementation(function MockOpenAI() {
      return {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      };
    });
  });

  it("melempar error jika API_KEY belum diatur", async () => {
    await expect(generateDiaryAssistantReply({ messages })).rejects.toThrow(
      "API_KEY belum diatur.",
    );
  });

  it("mengambil output_text dan menormalisasi newline", async () => {
    process.env.API_KEY = "key";
    process.env.BASE_URL = "https://example.test/";
    mockCreate.mockResolvedValue({ output_text: " Halo\r\nRuri " });

    await expect(generateDiaryAssistantReply({ messages })).resolves.toBe(
      "Halo\nRuri",
    );
    expect(mockOpenAI).toHaveBeenCalledWith({
      apiKey: "key",
      baseURL: "https://example.test",
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 600 }),
    );
  });

  it("membaca teks dari output array dan message content nested", async () => {
    process.env.API_KEY = "key";
    mockCreate.mockResolvedValueOnce({
      output: [{ content: [{ text: "Dari output array" }] }],
    });

    await expect(generateDiaryAssistantReply({ messages })).resolves.toBe(
      "Dari output array",
    );

    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: [{ value: "Dari message nested" }],
          },
        },
      ],
    });

    await expect(generateDiaryAssistantReply({ messages })).resolves.toBe(
      "Dari message nested",
    );
  });

  it("retry dengan token lebih besar jika finish_reason length dan respons awal kosong", async () => {
    process.env.API_KEY = "key";
    mockCreate
      .mockResolvedValueOnce({ choices: [{ finish_reason: "length" }] })
      .mockResolvedValueOnce({ choices: [{ text: "Balasan retry" }] });

    await expect(generateDiaryAssistantReply({ messages })).resolves.toBe(
      "Balasan retry",
    );
    expect(mockCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ max_tokens: 1400 }),
    );
  });

  it("melempar error kosong saat initial/retry tetap tidak punya teks", async () => {
    process.env.API_KEY = "key";
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockCreate
      .mockResolvedValueOnce({ choices: [{ finish_reason: "length" }] })
      .mockResolvedValueOnce({ choices: [{ message: { content: "" } }] });

    await expect(generateDiaryAssistantReply({ messages })).rejects.toThrow(
      "Model mengembalikan respons kosong.",
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("menghasilkan stream chunk dan menolak stream kosong", async () => {
    process.env.API_KEY = "key";

    async function* stream() {
      yield { choices: [{ delta: { content: "Halo" } }] };
      yield { choices: [{ text: [{ value: ", Ruri" }] }] };
      yield { ignored: true };
    }

    mockCreate.mockResolvedValueOnce(stream());

    const chunks: string[] = [];
    for await (const chunk of generateDiaryAssistantReplyStream({ messages })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual(["Halo", ", Ruri"]);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ stream: true, max_tokens: 1400 }),
    );

    async function* emptyStream() {
      yield { choices: [{ delta: { content: "" } }] };
    }

    mockCreate.mockResolvedValueOnce(emptyStream());
    const emptyGenerator = generateDiaryAssistantReplyStream({ messages });

    await expect(async () => {
      for await (const chunk of emptyGenerator) {
        void chunk;
        // consume stream
      }
    }).rejects.toThrow("Model mengembalikan respons kosong.");
  });
});
