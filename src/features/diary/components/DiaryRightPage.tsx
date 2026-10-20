// ============================================================
//  src/features/diary/components/DiaryRightPage.tsx
//  Percakapan diary (TemanCerita) — satu layout responsif
// ============================================================

"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BookText,
  ChevronLeft,
  ChevronRight,
  Lock,
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

import { getMoodLabel } from "@/components/mood/mood-face-icons";
import { ConversationState, RiskLevel } from "@/app/generated/prisma/enums";
import { DIARY_TOPIC_LABELS } from "../constants/topics";
import type {
  DiaryConversation,
  DiaryEntry,
  ChatMessage,
  DiaryConversationStarter,
} from "../types";
import { MoodFace } from "./MoodFace";
import { ChatBubble } from "./ChatBubble";
import { AiAvatar } from "./AiAvatar";
import { TypingIndicator } from "./TypingIndicator";

type Props = {
  entry: DiaryEntry;
  messages: ChatMessage[];
  conversation?: DiaryConversation | null;
  starters: DiaryConversationStarter[];
  startersError?: string | null;
  inputValue: string;
  isAiTyping: boolean;
  isGreetingPending?: boolean;
  isMessagesLoading: boolean;
  sendError?: string | null;
  requiresReload?: boolean;
  isReadOnly: boolean;
  canWriteDiary: boolean;
  isPremium: boolean;
  diaryPerMonth: number;
  /** Tidak dipakai lagi (responsif via CSS); dipertahankan agar kompatibel. */
  isMobile?: boolean;
  /** Ada entri yang lebih lama/baru untuk dinavigasi. */
  hasPrevEntry?: boolean;
  hasNextEntry?: boolean;
  /** Membuka riwayat (drawer di tablet/mobile, sidebar saat diciutkan). */
  onOpenHistory?: () => void;
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

const TEXTAREA_MAX_HEIGHT = 128;

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
  conversation = null,
  starters,
  startersError,
  inputValue,
  isAiTyping,
  isGreetingPending = false,
  isMessagesLoading,
  sendError,
  requiresReload = false,
  isReadOnly,
  canWriteDiary,
  isPremium,
  diaryPerMonth,
  hasPrevEntry = true,
  hasNextEntry = true,
  onOpenHistory,
  onPrevEntry,
  onNextEntry,
  onInputChange,
  onSend,
  onKeyDown,
}: Props) {
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSend =
    inputValue.trim().length > 0 &&
    !isAiTyping &&
    !isMessagesLoading &&
    !requiresReload;
  const showStarters =
    entry.isToday &&
    canWriteDiary &&
    !isAiTyping &&
    !isMessagesLoading &&
    !messages.some((message) => message.role === "user");
  const displayMessages = useMemo(
    () => buildDisplayMessages(messages),
    [messages],
  );
  const lastMessageText =
    displayMessages[displayMessages.length - 1]?.text ?? "";
  const actionOptions = conversation?.actionOptions ?? [];
  const showActionOptions =
    !isAiTyping &&
    !isMessagesLoading &&
    messages.at(-1)?.role === "ai" &&
    conversation?.conversationState === ConversationState.ACTION &&
    conversation?.riskLevel === RiskLevel.NONE &&
    actionOptions.length >= 2;
  const canDiscussOption =
    !isReadOnly && canWriteDiary && !requiresReload && !isAiTyping;

  // Hero hanya muncul ketika entri hari ini memang belum berisi pesan apa pun.
  const showHero = showStarters && messages.length === 0 && !isGreetingPending;
  const showCompactStarters =
    showStarters &&
    !showHero &&
    (starters.length > 0 || Boolean(startersError));
  const showEmptyReadOnly =
    isReadOnly &&
    messages.length === 0 &&
    !isMessagesLoading &&
    !isGreetingPending &&
    !isAiTyping;

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

    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, [textareaRef]);

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
  }, [inputValue, resizeTextarea]);

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
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  };

  const handleActionOption = (option: string) => {
    const selectedOption = option.trim().replace(/[.!?]+$/, "");
    const draft = `Aku ingin mencoba langkah ini: ${selectedOption}. Bantu aku memikirkan cara memulainya yang sederhana.`;
    const currentDraft = inputValue.trim();
    onInputChange(currentDraft ? `${currentDraft}\n\n${draft}` : draft);
    textareaRef.current?.focus();
  };

  const starterButtons = (
    <div className="dy-starters">
      {starters.map((starter) => (
        <button
          key={starter.id}
          type="button"
          className="dy-starter"
          onClick={() => {
            onInputChange(starter.messageText);
            textareaRef.current?.focus();
          }}
        >
          {starter.label}
        </button>
      ))}
    </div>
  );

  return (
    <section className="dy-conversation" aria-label="Percakapan diary">
      <header className="dy-header">
        <div className="dy-header-inner">
          {onOpenHistory ? (
            <button
              type="button"
              className="dy-history-trigger"
              onClick={onOpenHistory}
              aria-controls="diary-history"
            >
              <BookText size={18} aria-hidden="true" /> Riwayat
            </button>
          ) : null}

          <div className="dy-header-title">
            <h1>{entry.dateLabel}</h1>
            <p>TemanCerita · Pendamping AI</p>
          </div>

          <div className="dy-header-tools">
            <div
              className="dy-header-mood"
              aria-label={`Mood: ${getMoodLabel(displayMood)}`}
            >
              <span aria-hidden="true">
                <MoodFace score={displayMood} size={26} />
              </span>
              <strong>{getMoodLabel(displayMood)}</strong>
            </div>

            <div
              className="dy-entry-nav"
              role="group"
              aria-label="Navigasi entri diary"
            >
              <small>Entri diary</small>
              <button
                type="button"
                onClick={onPrevEntry}
                disabled={!hasPrevEntry}
                aria-label="Entry sebelumnya"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onNextEntry}
                disabled={!hasNextEntry}
                aria-label="Entry berikutnya"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {conversation && conversation.topics.length > 0 ? (
        <div className="dy-topics" aria-label="Topik percakapan">
          <span>Topik cerita:</span>
          {conversation.topics.map((topic) => (
            <span key={topic} className="dy-topic-chip">
              {DIARY_TOPIC_LABELS[topic]}
            </span>
          ))}
        </div>
      ) : null}

      {!isPremium && entry.isToday && !canWriteDiary ? (
        <div className="dy-limit">
          <span>
            <TriangleAlert size={16} aria-hidden="true" />
            Batas {diaryPerMonth} sesi diary bulan ini tercapai. Upgrade ke
            Premium untuk menulis tanpa batas.
          </span>
          <Link href="/subscription">Upgrade →</Link>
        </div>
      ) : null}

      <div className="dy-scroll" ref={chatScrollRef}>
        <div className="dy-thread" role="log" aria-live="polite">
          {isReadOnly ? (
            <p className="dy-readonly">
              <Lock size={14} aria-hidden="true" />
              Diary ini sudah selesai - entri lampau hanya bisa dibaca.
            </p>
          ) : null}

          {isMessagesLoading ? (
            <div className="dy-loading" role="status">
              <span className="dy-spinner" aria-hidden="true" />
              Memuat percakapan…
            </div>
          ) : null}

          {showHero ? (
            <div className="dy-hero">
              <Image
                className="dy-hero-logo"
                src="/img/LOGO_TEMANTUMBUH.svg"
                alt=""
                width={44}
                height={44}
              />
              <span className="dy-hero-hand">
                ceritamu boleh dimulai dari mana saja
              </span>
              <h2>Mau cerita tentang apa hari ini?</h2>
              <p>
                {starters.length > 0
                  ? "Kamu bisa mulai dari pilihan di bawah atau langsung menulis ceritamu."
                  : "Tulis ceritamu di kolom bawah kapan pun kamu siap."}
              </p>
              {startersError ? (
                <p role="status" className="dy-hero-note">
                  Pilihan awal belum tersedia. Kamu tetap bisa menulis di bawah.
                </p>
              ) : starters.length > 0 ? (
                starterButtons
              ) : null}
              <svg
                className="dy-hero-doodle"
                viewBox="0 0 100 60"
                aria-hidden="true"
              >
                <path d="M4 45c23-37 41 19 65-15 8-11 16-10 26-4M83 16l13 10-12 8" />
              </svg>
            </div>
          ) : null}

          {showEmptyReadOnly ? (
            <div className="dy-empty-entry">
              <strong>{entry.dateLabel}</strong>
              Belum ada cerita pada hari ini.
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

          {showActionOptions ? (
            <section
              className="dy-action-choices"
              aria-label="Pilihan tindakan"
            >
              <div className="dy-action-choices-heading">
                <strong>Kalau kamu ingin mencoba sesuatu</strong>
                <p>
                  {canDiscussOption
                    ? "Pilih satu untuk dibahas, atau lanjut menulis dengan caramu sendiri."
                    : "Pilihan yang sempat muncul dalam percakapan ini."}
                </p>
              </div>
              <ol className="dy-action-choices-list">
                {actionOptions.map((option, index) => (
                  <li key={`${index}-${option}`}>
                    {canDiscussOption ? (
                      <button
                        type="button"
                        className="dy-action-choice"
                        onClick={() => handleActionOption(option)}
                      >
                        <span
                          className="dy-action-choice-number"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <span>{option}</span>
                      </button>
                    ) : (
                      <div className="dy-action-choice is-readonly">
                        <span
                          className="dy-action-choice-number"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                        <span>{option}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {showCompactStarters ? (
            <div className="dy-starter-block">
              <p>
                Mau mulai dari mana? Pilih salah satu atau tulis ceritamu
                sendiri.
              </p>
              {startersError ? (
                <p role="status">
                  Pilihan awal belum tersedia. Kamu tetap bisa menulis di bawah.
                </p>
              ) : (
                starterButtons
              )}
            </div>
          ) : null}

          {isGreetingPending ? (
            <div className="dy-status" role="status" aria-live="polite">
              <AiAvatar />
              <p>
                <strong>Menyiapkan sapaan…</strong>
                Kamu tetap bisa mulai cerita.
              </p>
              <span className="dy-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </div>
          ) : isAiTyping ? (
            <TypingIndicator />
          ) : null}
        </div>
      </div>

      <div className="dy-composer">
        <div className="dy-composer-inner">
          {sendError ? (
            <div className="dy-error" role="alert">
              <strong>Pesan belum terkirim.</strong>
              {sendError}
              {requiresReload ? (
                <>
                  <p>
                    Salin draf di kolom chat sebelum memuat ulang jika ingin
                    menyimpannya.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                  >
                    Muat ulang diary
                  </button>
                </>
              ) : (
                <p>
                  Ceritamu masih ada di kolom tulis. Kirim lagi untuk mencoba.
                </p>
              )}
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
              disabled={isAiTyping || isMessagesLoading}
              textareaRef={textareaRef}
              onChange={handleTextareaChange}
              onSend={onSend}
              onKeyDown={handleTextareaKeyDown}
            />
          )}
        </div>
      </div>
    </section>
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

  return normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function LockedInputNotice({ message }: { message: string }) {
  return (
    <div className="dy-locked">
      <Lock size={16} aria-hidden="true" />
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
}

function ChatInputRow({
  value,
  canSend,
  disabled,
  textareaRef,
  onChange,
  onSend,
  onKeyDown,
}: {
  value: string;
  canSend: boolean;
  disabled: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSend) onSend();
      }}
    >
      <div className="dy-composer-box">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={1}
          aria-label="Tulis ceritamu"
          placeholder="Tulis ceritamu di sini..."
        />
        <button
          type="submit"
          className="dy-send"
          disabled={!canSend}
          aria-label="Kirim pesan"
        >
          <SendHorizonal size={19} aria-hidden="true" />
        </button>
      </div>
      <small className="dy-hint">
        Enter untuk kirim · Shift+Enter untuk baris baru
      </small>
    </form>
  );
}
