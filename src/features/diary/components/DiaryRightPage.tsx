// ============================================================
//  src/features/diary/components/DiaryRightPage.tsx
//  Halaman kanan diary — responsive desktop & mobile
// ============================================================

"use client";

import {
  Lock,
  ChevronLeft,
  ChevronRight,
  SendHorizonal,
  TriangleAlert,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useCallback,
  type RefObject,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { colors as C, fonts } from "../constants/tokens";
import type { DiaryEntry, ChatMessage } from "../types";
import { MoodFace } from "./MoodFace";
import { ChatBubble } from "./ChatBubble";
import { TypingIndicator } from "./TypingIndicator";

type Props = {
  entry: DiaryEntry;
  messages: ChatMessage[];
  inputValue: string;
  isAiTyping: boolean;
  sendError?: string | null;
  isReadOnly: boolean;
  canWriteDiary: boolean;
  isPremium: boolean;
  diaryPerMonth: number;
  isMobile?: boolean;
  onPrevEntry: () => void;
  onNextEntry: () => void;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
};

type DisplayChatMessage = ChatMessage & {
  displayKey: string;
  showAiMeta?: boolean;
  showTimestamp?: boolean;
};

type MoodScore = 1 | 2 | 3 | 4 | 5;

type MoodLog = {
  id: string;
  moodScore: MoodScore;
  note?: string | null;
  createdAt: string;
};

type DiaryEntryWithMoodFallback = DiaryEntry & {
  mood?: number | string | null;
  moodScore?: number | string | null;
  latestMoodScore?: number | string | null;
  selectedMood?: number | string | null;
  score?: number | string | null;
  moodLog?: {
    moodScore?: number | string | null;
    score?: number | string | null;
  } | null;
  fullDate?: string | Date | null;
  createdAt?: string | Date | null;
  isoDate?: string | null;
  rawDate?: string | null;
};

function getTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  } catch {
    return "Asia/Jakarta";
  }
}

function getLocalDateString(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().split("T")[0];
  }
}

function clampMoodScore(value: number): MoodScore {
  if (value <= 1) return 1;
  if (value >= 5) return 5;

  const rounded = Math.round(value);

  if (rounded === 1) return 1;
  if (rounded === 2) return 2;
  if (rounded === 3) return 3;
  if (rounded === 4) return 4;
  return 5;
}

function normalizeMood(value: unknown): MoodScore | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampMoodScore(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return clampMoodScore(parsed);
    }
  }

  return null;
}

function resolveEntryDate(entry: DiaryEntryWithMoodFallback): Date | null {
  const candidates: unknown[] = [
    entry.fullDate,
    entry.date,
    entry.createdAt,
    entry.isoDate,
    entry.rawDate,
  ];

  for (const candidate of candidates) {
    if (candidate instanceof Date && !Number.isNaN(candidate.getTime())) {
      return candidate;
    }

    if (typeof candidate === "string" || typeof candidate === "number") {
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

function resolveMoodFromEntry(entry: DiaryEntryWithMoodFallback): MoodScore {
  const candidates = [
    entry.mood,
    entry.moodScore,
    entry.latestMoodScore,
    entry.selectedMood,
    entry.score,
    entry.moodLog?.moodScore,
    entry.moodLog?.score,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeMood(candidate);
    if (normalized !== null) return normalized;
  }

  return 3;
}

export function DiaryRightPage({
  entry,
  messages,
  inputValue,
  isAiTyping,
  sendError,
  isReadOnly,
  canWriteDiary,
  isPremium,
  diaryPerMonth,
  isMobile = false,
  onPrevEntry,
  onNextEntry,
  onInputChange,
  onSend,
  onKeyDown,
}: Props) {
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSend = inputValue.trim().length > 0 && !isAiTyping;
  const displayMessages = useMemo(
    () => buildDisplayMessages(messages),
    [messages],
  );
  const lastMessageText =
    displayMessages[displayMessages.length - 1]?.text ?? "";

  const timezone = useMemo(() => getTimezone(), []);

  const { data: moodLogs = [] } = useQuery<MoodLog[]>({
    queryKey: ["mood-logs"],
    queryFn: async () => {
      const res = await fetch("/api/mood", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch mood logs");

      const json = (await res.json()) as {
        success: boolean;
        data: MoodLog[];
      };

      return json.data ?? [];
    },
    staleTime: 30_000,
  });

  const displayMood = useMemo<MoodScore>(() => {
    const safeEntry = entry as DiaryEntryWithMoodFallback;
    const entryDate = resolveEntryDate(safeEntry);

    if (entryDate) {
      const entryLocalDate = getLocalDateString(entryDate, timezone);

      const matchedMood = moodLogs.find((log) => {
        const logLocalDate = getLocalDateString(
          new Date(log.createdAt),
          timezone,
        );
        return logLocalDate === entryLocalDate;
      });

      if (matchedMood) {
        return clampMoodScore(matchedMood.moodScore);
      }
    }

    return resolveMoodFromEntry(safeEntry);
  }, [entry, moodLogs, timezone]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const maxHeight = isMobile ? 104 : 128;
    el.style.height = "0px";
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [textareaRef, isMobile]);

  useEffect(() => {
    const chatContainer = chatScrollRef.current;

    if (!chatContainer) {
      return;
    }

    let nestedRafId: number | null = null;
    const id = window.requestAnimationFrame(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;

      nestedRafId = window.requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    });

    const timeoutId = window.setTimeout(() => {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 120);

    return () => {
      window.cancelAnimationFrame(id);

      if (nestedRafId !== null) {
        window.cancelAnimationFrame(nestedRafId);
      }

      window.clearTimeout(timeoutId);
    };
  }, [entry.id, displayMessages.length, lastMessageText, isAiTyping]);

  useEffect(() => {
    resizeTextarea();
  }, [inputValue, isMobile, resizeTextarea]);

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
      return;
    }

    onKeyDown(e);

    if (e.key === "Enter" && e.shiftKey) {
      window.requestAnimationFrame(() => {
        resizeTextarea();
      });
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange(e.target.value);

    const el = e.target;
    const maxHeight = isMobile ? 104 : 128;
    el.style.height = "0px";
    const nextHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: C.paper,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: "100%",
        minHeight: 0,
        maxHeight: "100%",
        overflow: "hidden",
      }}
    >
      {!isMobile ? (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 14,
            height: "100%",
            background:
              "linear-gradient(to right,rgba(0,0,0,0.05),transparent)",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      ) : null}

      <div
        style={{
          flexShrink: 0,
          padding: isMobile ? "16px 16px 12px 44px" : "16px 22px 12px 56px",
          borderBottom: `1px solid ${C.spine}`,
          background: C.paper,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          zIndex: 2,
          position: "relative",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
              flexWrap: "wrap",
            }}
          >
            <p
              style={{
                fontWeight: 900,
                fontSize: isMobile ? 14 : 15,
                color: C.inkD,
                fontFamily: fonts.serif,
                fontStyle: "italic",
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {entry.dateLabel}
            </p>
          </div>

          <p
            style={{
              fontSize: 10.5,
              color: C.sub,
              fontFamily: fonts.sans,
              margin: 0,
            }}
          >
            TemanCerita · AI Companion
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <MoodFace score={displayMood} size={28} />
          <div style={{ height: 28, width: 1, background: C.bdL }} />
          <NavArrowButton onClick={onPrevEntry} direction="left" />
          <NavArrowButton onClick={onNextEntry} direction="right" />
        </div>
      </div>

      {!isPremium && entry.isToday && !canWriteDiary ? (
        <div
          style={{
            flexShrink: 0,
            padding: isMobile ? "10px 14px" : "10px 22px",
            background: C.amberL,
            borderBottom: `1px solid ${C.amberB}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <TriangleAlert
              size={16}
              color={C.amber}
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: 12,
                color: C.amber,
                fontWeight: 600,
                lineHeight: 1.5,
              }}
            >
              Batas {diaryPerMonth} sesi diary bulan ini tercapai. Upgrade ke
              Premium untuk menulis tanpa batas.
            </span>
          </div>

          <button
            style={{
              flexShrink: 0,
              padding: "6px 14px",
              borderRadius: 10,
              border: "none",
              background: C.gold,
              color: C.white,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fonts.sans,
            }}
          >
            Upgrade →
          </button>
        </div>
      ) : null}

      <div
        ref={chatScrollRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: isMobile ? "14px 14px 18px" : "16px 22px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: `linear-gradient(180deg, ${C.paper} 0%, ${C.white} 100%)`,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {isReadOnly ? (
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 10,
              background: C.bg,
              border: `1px solid ${C.bdL}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              alignSelf: "center",
              maxWidth: "100%",
            }}
          >
            <Lock size={11} color={C.sub} />
            <p
              style={{
                fontSize: 11,
                color: C.sub,
                fontStyle: "italic",
                margin: 0,
                textAlign: "center",
              }}
            >
              Diary ini sudah selesai - entri lampau hanya bisa dibaca.
            </p>
          </div>
        ) : null}

        {displayMessages.map((msg) => (
          <ChatBubble
            key={msg.displayKey}
            message={msg}
            showAiMeta={msg.showAiMeta}
            showTimestamp={msg.showTimestamp}
          />
        ))}

        {isAiTyping ? <TypingIndicator /> : null}
      </div>

      <div
        style={{
          flexShrink: 0,
          padding: isMobile ? "12px 14px 10px" : "12px 18px 12px",
          borderTop: `1px solid ${C.spine}`,
          background: C.paperL,
          zIndex: 2,
          position: "relative",
        }}
      >
        {sendError ? (
          <div
            style={{
              marginBottom: 10,
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${C.amberB}`,
              background: C.amberL,
              color: C.amber,
              fontSize: 11,
              lineHeight: 1.45,
              fontFamily: fonts.sans,
            }}
          >
            {sendError}
          </div>
        ) : null}

        {isReadOnly ? (
          <LockedInputNotice message="Entri lampau tidak bisa diedit - pilih Hari Ini untuk menulis baru." />
        ) : !canWriteDiary ? (
          <LockedInputNotice message="Batas sesi bulan ini tercapai. Upgrade ke Premium untuk lanjut menulis." />
        ) : (
          <ChatInputRow
            value={inputValue}
            canSend={canSend}
            textareaRef={textareaRef}
            onChange={handleTextareaChange}
            onSend={onSend}
            onKeyDown={handleTextareaKeyDown}
            isMobile={isMobile}
          />
        )}
      </div>
    </div>
  );
}

function buildDisplayMessages(messages: ChatMessage[]): DisplayChatMessage[] {
  return messages.flatMap((message, index) => {
    const baseId = message.id || `${message.role}-${index}`;

    if (message.role !== "ai") {
      return [
        {
          ...message,
          displayKey: baseId,
          showAiMeta: false,
          showTimestamp: true,
        },
      ];
    }

    const bubbles = splitAiMessageIntoBubbles(message.text);

    if (bubbles.length <= 1) {
      return [
        {
          ...message,
          text: bubbles[0] ?? message.text,
          displayKey: baseId,
          showAiMeta: true,
          showTimestamp: true,
        },
      ];
    }

    return bubbles.map((bubbleText, bubbleIndex) => ({
      ...message,
      text: bubbleText,
      displayKey: `${baseId}-bubble-${bubbleIndex}`,
      showAiMeta: bubbleIndex === 0,
      showTimestamp: bubbleIndex === bubbles.length - 1,
    }));
  });
}

function splitAiMessageIntoBubbles(rawText: string): string[] {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const paragraphBlocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphBlocks.length > 1) {
    return paragraphBlocks.flatMap((block) => splitLongBlockIntoBubbles(block));
  }

  const lineBlocks = normalized
    .split("\n")
    .map((block) => block.trim())
    .filter(Boolean);

  if (lineBlocks.length > 1) {
    return lineBlocks.flatMap((block) => splitLongBlockIntoBubbles(block));
  }

  return splitLongBlockIntoBubbles(normalized);
}

function splitLongBlockIntoBubbles(block: string): string[] {
  const MAX_BUBBLE_CHARS = 210;
  const IDEAL_BUBBLE_CHARS = 150;
  const MAX_SENTENCES_PER_BUBBLE = 2;

  if (block.length <= MAX_BUBBLE_CHARS) {
    return [block];
  }

  const sentences = splitIntoSentences(block);

  if (sentences.length <= 1) {
    return chunkTextByLength(block, IDEAL_BUBBLE_CHARS);
  }

  const bundled: string[] = [];
  let currentBubble = "";
  let sentenceCount = 0;

  for (const sentence of sentences) {
    const nextBubble = currentBubble
      ? `${currentBubble} ${sentence}`
      : sentence;

    const shouldWrap =
      nextBubble.length > MAX_BUBBLE_CHARS ||
      sentenceCount >= MAX_SENTENCES_PER_BUBBLE;

    if (shouldWrap && currentBubble) {
      bundled.push(currentBubble.trim());
      currentBubble = sentence;
      sentenceCount = 1;
    } else {
      currentBubble = nextBubble;
      sentenceCount += 1;
    }
  }

  if (currentBubble.trim()) {
    bundled.push(currentBubble.trim());
  }

  return bundled.flatMap((item) =>
    item.length > MAX_BUBBLE_CHARS
      ? chunkTextByLength(item, IDEAL_BUBBLE_CHARS)
      : [item],
  );
}

function splitIntoSentences(text: string): string[] {
  return (
    text
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [text]
  );
}

function chunkTextByLength(text: string, maxLength: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    const nextChunk = currentChunk ? `${currentChunk} ${word}` : word;

    if (nextChunk.length > maxLength && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = nextChunk;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function NavArrowButton({
  onClick,
  direction,
}: {
  onClick: () => void;
  direction: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        direction === "left" ? "Entry sebelumnya" : "Entry berikutnya"
      }
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        border: `1px solid ${C.bdL}`,
        background: C.white,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: C.ink,
        boxShadow: "0 2px 8px rgba(13,70,70,0.05)",
        transition: "all 0.16s ease",
      }}
    >
      {direction === "left" ? (
        <ChevronLeft size={15} />
      ) : (
        <ChevronRight size={15} />
      )}
    </button>
  );
}

function LockedInputNotice({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: 48,
        borderRadius: 14,
        border: `1px solid ${C.bdL}`,
        background: C.bg,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Lock size={14} color={C.sub} />
      <p
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.45,
          color: C.sub,
          fontFamily: fonts.sans,
        }}
      >
        {message}
      </p>
    </div>
  );
}

function ChatInputRow({
  value,
  canSend,
  textareaRef,
  onChange,
  onSend,
  onKeyDown,
  isMobile,
}: {
  value: string;
  canSend: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  isMobile: boolean;
}) {
  const buttonSize = isMobile ? 40 : 42;
  const minInputHeight = isMobile ? 40 : 42;

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${C.bd}`,
        background: C.white,
        padding: isMobile ? "7px 7px 7px 12px" : "8px 8px 8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 8px 22px rgba(13,70,70,0.06)",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: minInputHeight,
          display: "flex",
          alignItems: "center",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Tulis ceritamu di sini..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            color: C.inkD,
            fontSize: isMobile ? 13 : 14,
            lineHeight: isMobile ? "20px" : "22px",
            fontFamily: fonts.sans,
            minHeight: isMobile ? 20 : 22,
            maxHeight: isMobile ? 104 : 128,
            padding: 0,
            margin: 0,
            display: "block",
          }}
        />
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        aria-label="Kirim pesan"
        style={{
          width: buttonSize,
          height: buttonSize,
          borderRadius: 13,
          border: "none",
          background: canSend ? C.inkD : C.bg,
          color: canSend ? C.white : C.sub,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canSend ? "pointer" : "not-allowed",
          flexShrink: 0,
          transition: "all 0.16s ease",
          boxShadow: canSend ? "0 6px 16px rgba(13,70,70,0.16)" : "none",
        }}
      >
        <SendHorizonal size={16} />
      </button>
    </div>
  );
}
