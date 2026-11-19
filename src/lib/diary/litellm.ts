import OpenAI from "openai";
import type { DiaryPromptMessage } from "@/lib/diary/prompt";

type UnknownRecord = Record<string, unknown>;

type ChatCompletionLike = {
  output_text?: unknown;
  output?: unknown;
  choices?: Array<{
    text?: unknown;
    finish_reason?: string | null;
    delta?: {
      content?: unknown;
    };
    message?: {
      content?: unknown;
      refusal?: unknown;
      reasoning_content?: unknown;
    } & UnknownRecord;
  }>;
};

type ChatChoiceLike = NonNullable<ChatCompletionLike["choices"]>[number];

type GenerateDiaryReplyInput = {
  messages: DiaryPromptMessage[];
};

type GenerateDiaryReplyStreamInput = {
  messages: DiaryPromptMessage[];
};

const DEFAULT_BASE_URL = "https://api.koboillm.com/v1";
const DEFAULT_MODEL = "openai/gpt-5-mini";
const DEFAULT_MAX_TOKENS = 600;
const RETRY_MAX_TOKENS = 1400;

export async function generateDiaryAssistantReply({
  messages,
}: GenerateDiaryReplyInput): Promise<string> {
  const { client, model } = createDiaryOpenAIClient();

  const firstAttempt = await callChatCompletions({
    client,
    model,
    messages,
    maxTokens: DEFAULT_MAX_TOKENS,
  });

  let text = extractAssistantText(firstAttempt).trim();

  if (!text && shouldRetryForLength(firstAttempt)) {
    const secondAttempt = await callChatCompletions({
      client,
      model,
      messages,
      maxTokens: RETRY_MAX_TOKENS,
    });

    text = extractAssistantText(secondAttempt).trim();

    if (text) {
      return normalizeOutputText(text);
    }

    logEmptyPayloadShape(secondAttempt, "retry");
    throw new Error("Model mengembalikan respons kosong.");
  }

  if (!text) {
    logEmptyPayloadShape(firstAttempt, "initial");
    throw new Error("Model mengembalikan respons kosong.");
  }

  return normalizeOutputText(text);
}

export async function* generateDiaryAssistantReplyStream({
  messages,
}: GenerateDiaryReplyStreamInput): AsyncGenerator<string, string, void> {
  const { client, model } = createDiaryOpenAIClient();

  const stream = await client.chat.completions.create({
    model,
    temperature: 0.9,
    max_tokens: RETRY_MAX_TOKENS,
    presence_penalty: 0.4,
    frequency_penalty: 0.2,
    messages,
    stream: true,
  });

  let assistantText = "";

  for await (const chunk of stream as AsyncIterable<unknown>) {
    const textChunk = extractStreamChunkText(chunk);

    if (!textChunk) {
      continue;
    }

    assistantText += textChunk;
    yield textChunk;
  }

  const normalized = normalizeOutputText(assistantText);

  if (!normalized) {
    throw new Error("Model mengembalikan respons kosong.");
  }

  return normalized;
}

function createDiaryOpenAIClient() {
  const apiKey = (process.env.API_KEY || "").trim();

  if (!apiKey) {
    throw new Error("API_KEY belum diatur.");
  }

  const baseUrl = (process.env.BASE_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/$/, "");

  const model = DEFAULT_MODEL.trim();
  const client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
  });

  return {
    client,
    model,
  };
}

async function callChatCompletions({
  client,
  model,
  messages,
  maxTokens,
}: {
  client: OpenAI;
  model: string;
  messages: DiaryPromptMessage[];
  maxTokens: number;
}): Promise<ChatCompletionLike> {
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.9,
    max_tokens: maxTokens,
    presence_penalty: 0.4,
    frequency_penalty: 0.2,
    messages,
  });

  return completion as unknown as ChatCompletionLike;
}

function extractAssistantText(payload: ChatCompletionLike | null) {
  if (!payload) {
    return "";
  }

  const rootOutputText = extractTextValue(payload.output_text);
  if (rootOutputText) {
    return rootOutputText;
  }

  const rootOutputArrayText = extractTextFromOutputArray(payload.output);
  if (rootOutputArrayText) {
    return rootOutputArrayText;
  }

  const choices = Array.isArray(payload.choices) ? payload.choices : [];

  for (const choice of choices) {
    const choiceText = extractTextValue(choice.text);
    if (choiceText) {
      return choiceText;
    }

    const deltaText = extractTextValue(choice.delta?.content);
    if (deltaText) {
      return deltaText;
    }

    const message = choice.message;

    if (!message) {
      continue;
    }

    const messageContent = extractTextValue(message.content);
    if (messageContent) {
      return messageContent;
    }

    const reasoningContent = extractTextValue(message.reasoning_content);
    if (reasoningContent) {
      return reasoningContent;
    }

    const refusal = extractTextValue(message.refusal);
    if (refusal) {
      return refusal;
    }
  }

  return "";
}

function extractTextFromOutputArray(output: unknown) {
  if (!Array.isArray(output)) {
    return "";
  }

  for (const block of output) {
    const blockRecord = asRecord(block);
    if (!blockRecord) {
      continue;
    }

    const fromBlockText = extractTextValue(blockRecord.text);
    if (fromBlockText) {
      return fromBlockText;
    }

    const fromBlockContent = extractTextValue(blockRecord.content);
    if (fromBlockContent) {
      return fromBlockContent;
    }

    const fromNestedOutput = extractTextValue(blockRecord.output_text);
    if (fromNestedOutput) {
      return fromNestedOutput;
    }
  }

  return "";
}

function extractTextValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((part) => extractTextValue(part))
      .filter(Boolean)
      .join("\n")
      .trim();

    if (joined) {
      return joined;
    }

    return "";
  }

  const record = asRecord(value);

  if (!record) {
    return "";
  }

  const directCandidates = [
    record.text,
    record.value,
    record.content,
    record.output_text,
    record.reasoning_content,
    record.refusal,
    record.provider_specific_fields,
  ];

  for (const candidate of directCandidates) {
    const extracted = extractTextValue(candidate);
    if (extracted) {
      return extracted;
    }
  }

  return "";
}

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function summarizeChoiceShape(choice: ChatChoiceLike | undefined) {
  if (!choice) {
    return null;
  }

  const message = choice.message;
  const content = message?.content;

  return {
    hasChoiceText:
      typeof choice.text === "string" && choice.text.trim().length > 0,
    hasDeltaContent: Boolean(choice.delta?.content),
    hasMessage: Boolean(message),
    messageContentType: Array.isArray(content) ? "array" : typeof content,
    hasReasoning: Boolean(message?.reasoning_content),
    hasRefusal: Boolean(message?.refusal),
    finishReason: choice.finish_reason,
  };
}

function extractStreamChunkText(chunk: unknown): string {
  const chunkRecord = asRecord(chunk);

  if (!chunkRecord) {
    return "";
  }

  const choices = Array.isArray(chunkRecord.choices) ? chunkRecord.choices : [];

  for (const choice of choices) {
    const choiceRecord = asRecord(choice);

    if (!choiceRecord) {
      continue;
    }

    const deltaRecord = asRecord(choiceRecord.delta);
    const fromDelta = extractStreamTextValue(deltaRecord?.content);

    if (fromDelta) {
      return fromDelta;
    }

    const fromChoiceText = extractStreamTextValue(choiceRecord.text);

    if (fromChoiceText) {
      return fromChoiceText;
    }
  }

  return "";
}

function extractStreamTextValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((part) => extractStreamTextValue(part)).join("");
  }

  const record = asRecord(value);

  if (!record) {
    return "";
  }

  const candidates = [
    record.text,
    record.value,
    record.content,
    record.output_text,
    record.reasoning_content,
  ];

  for (const candidate of candidates) {
    const extracted = extractStreamTextValue(candidate);

    if (extracted) {
      return extracted;
    }
  }

  return "";
}

function shouldRetryForLength(payload: ChatCompletionLike | null) {
  if (!Array.isArray(payload?.choices)) {
    return false;
  }

  return payload.choices.some(
    (choice) => (choice.finish_reason || "").toLowerCase() === "length",
  );
}

function logEmptyPayloadShape(
  payload: ChatCompletionLike | null,
  phase: "initial" | "retry",
) {
  console.error("LiteLLM empty assistant text. Payload shape:", {
    phase,
    hasOutputText: Boolean(payload?.output_text),
    hasOutput: Array.isArray((payload as UnknownRecord | null)?.output),
    choicesCount: Array.isArray(payload?.choices) ? payload.choices.length : 0,
    firstChoiceShape: summarizeChoiceShape(payload?.choices?.[0]),
  });
}

function normalizeOutputText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}
