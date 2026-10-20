import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());
const mockOpenAI = vi.hoisted(() => vi.fn());

vi.mock("openai", () => ({
  default: mockOpenAI,
}));

import {
  generateDiaryAssistantReply,
  generateDiaryAssistantReplyStream,
  generateDiaryStructuredReply,
} from "@/lib/diary/litellm";
import { DiaryStructuredOutputError } from "@/lib/diary/structured-output";
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
      expect.objectContaining({ max_tokens: 2500 }),
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
      expect.objectContaining({ stream: true, max_tokens: 2500 }),
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

  it("menghasilkan balasan dan metadata dalam satu completion JSON", async () => {
    process.env.API_KEY = "key";
    const output = {
      reply: "Aku mendengarmu.",
      topics: ["KELUARGA", "PERTEMANAN"],
      conversationState: "CLARIFICATION",
      conversationSummary: null,
      proactiveSuggestion: null,
      safety: {
        flag: false,
        riskLevel: "NONE",
        category: null,
        summary: null,
      },
    };
    mockCreate.mockResolvedValue({
      choices: [
        { finish_reason: "stop", message: { content: JSON.stringify(output) } },
      ],
    });

    await expect(generateDiaryStructuredReply({ messages })).resolves.toEqual(
      output,
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: "json_object" },
        max_tokens: 2500,
      }),
    );
  });

  it("menolak hasil terpotong atau invalid tanpa melakukan generation kedua", async () => {
    process.env.API_KEY = "key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ finish_reason: "length", message: { content: "{}" } }],
    });
    await expect(generateDiaryStructuredReply({ messages })).rejects.toThrow(
      DiaryStructuredOutputError,
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);

    mockCreate.mockResolvedValueOnce({
      choices: [{ finish_reason: "stop", message: { content: "bukan JSON" } }],
    });
    await expect(generateDiaryStructuredReply({ messages })).rejects.toThrow(
      DiaryStructuredOutputError,
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("menolak respons kosong dan meneruskan kegagalan provider", async () => {
    process.env.API_KEY = "key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
    });
    await expect(generateDiaryStructuredReply({ messages })).rejects.toThrow(
      DiaryStructuredOutputError,
    );

    const providerError = new Error("provider unavailable");
    mockCreate.mockRejectedValueOnce(providerError);
    await expect(generateDiaryStructuredReply({ messages })).rejects.toBe(
      providerError,
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
