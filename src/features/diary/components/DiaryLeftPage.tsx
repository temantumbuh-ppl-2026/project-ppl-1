"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Crown,
  Flame,
  AlertTriangle,
  PanelLeftClose,
} from "lucide-react";

import { colors as C } from "../constants/tokens";
import type { DiaryEntry, UserProfile, PlanConfig } from "../types";
import { EntryCard } from "./EntryCard";
import { CalendarDropdown } from "@/components/ui/manual/calendar-dropdown";

type Props = {
  mode: "desktop" | "mobile";
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  user: UserProfile;
  entries: DiaryEntry[];
  selectedEntry: DiaryEntry | null;
  activeMonth: string;
  selectedDate?: Date;
  planCfg: PlanConfig;
  quizRemaining: number;
  canDoQuiz: boolean;
  isQuestionPoolExhausted: boolean;
  onSelectEntry: (entry: DiaryEntry) => void;
  onGoToToday: () => void;
  onOpenQuiz: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date | undefined) => void;
};

type MoodScore = 1 | 2 | 3 | 4 | 5;

type MoodLog = {
  id: string;
  moodScore: MoodScore;
  note?: string | null;
  createdAt: string;
};

type DiaryEntryWithMood = DiaryEntry & {
  mood?: MoodScore;
};

export const MOBILE_STRIP_WIDTH = 46;

const ENTRY_GAP = 8;

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

function resolveEntryDate(entry: DiaryEntry): Date | null {
  const candidates: unknown[] = [
    (entry as { fullDate?: unknown }).fullDate,
    (entry as { date?: unknown }).date,
    (entry as { createdAt?: unknown }).createdAt,
    (entry as { isoDate?: unknown }).isoDate,
    (entry as { rawDate?: unknown }).rawDate,
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

export function DiaryLeftPage({
  mode,
  isOpen,
  onClose,
  user,
  entries,
  selectedEntry,
  activeMonth,
  selectedDate,
  planCfg,
  quizRemaining,
  canDoQuiz,
  isQuestionPoolExhausted,
  onSelectEntry,
  onGoToToday,
  onOpenQuiz,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: Props) {
  if (mode === "mobile") {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.2)",
              zIndex: 119,
            }}
            onClick={onClose}
          />
        )}
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: isOpen ? "100%" : 0,
            maxWidth: isOpen ? 360 : 0,
            background: C.paperL,
            boxShadow: isOpen ? "20px 0 60px rgba(12, 24, 32, 0.16)" : "none",
            transition:
              "width 260ms cubic-bezier(0.22,1,0.36,1), max-width 260ms cubic-bezier(0.22,1,0.36,1)",
            zIndex: 120,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            height: "100dvh",
            overflow: "hidden",
          }}
        >
          {isOpen && (
            <div
              style={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Back button header */}
              <div
                style={{
                  flexShrink: 0,
                  padding: "10px 12px 8px",
                  borderBottom: `1px solid ${C.bdL}`,
                  background: C.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  onClick={() => (window.location.href = "/home")}
                  style={{
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 999,
                    border: "none",
                    background: "transparent",
                    color: C.inkD,
                    fontSize: 12,
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Kembali</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: "none",
                    background: "transparent",
                    color: C.inkD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  aria-label="Tutup riwayat diary"
                  title="Tutup riwayat diary"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                <PanelContent
                  user={user}
                  entries={entries}
                  selectedEntry={selectedEntry}
                  activeMonth={activeMonth}
                  selectedDate={selectedDate}
                  planCfg={planCfg}
                  quizRemaining={quizRemaining}
                  canDoQuiz={canDoQuiz}
                  isQuestionPoolExhausted={isQuestionPoolExhausted}
                  onSelectEntry={onSelectEntry}
                  onGoToToday={onGoToToday}
                  onOpenQuiz={onOpenQuiz}
                  onPrevMonth={onPrevMonth}
                  onNextMonth={onNextMonth}
                  onSelectDate={onSelectDate}
                  onClose={onClose}
                  mobileMode
                />
              </div>
            </div>
          )}
        </aside>
      </>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        background: C.paperL,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <PanelContent
        user={user}
        entries={entries}
        selectedEntry={selectedEntry}
        activeMonth={activeMonth}
        selectedDate={selectedDate}
        planCfg={planCfg}
        quizRemaining={quizRemaining}
        canDoQuiz={canDoQuiz}
        isQuestionPoolExhausted={isQuestionPoolExhausted}
        onSelectEntry={onSelectEntry}
        onGoToToday={onGoToToday}
        onOpenQuiz={onOpenQuiz}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onSelectDate={onSelectDate}
        onClose={onClose}
        desktopCloseIcon
      />
    </aside>
  );
}

type PanelContentProps = {
  user: UserProfile;
  entries: DiaryEntry[];
  selectedEntry: DiaryEntry | null;
  activeMonth: string;
  selectedDate?: Date;
  planCfg: PlanConfig;
  quizRemaining: number;
  canDoQuiz: boolean;
  isQuestionPoolExhausted: boolean;
  onSelectEntry: (entry: DiaryEntry) => void;
  onGoToToday: () => void;
  onOpenQuiz: () => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date | undefined) => void;
  onClose: () => void;
  desktopCloseIcon?: boolean;
  mobileMode?: boolean;
};

function PanelContent({
  user,
  entries,
  selectedEntry,
  activeMonth,
  selectedDate,
  planCfg,
  quizRemaining,
  canDoQuiz,
  isQuestionPoolExhausted,
  onSelectEntry,
  onGoToToday,
  onOpenQuiz,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  mobileMode = false,
}: PanelContentProps) {
  const timezone = React.useMemo(() => getTimezone(), []);
  const canOpenQuiz = canDoQuiz || isQuestionPoolExhausted;

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

  const entriesWithMood = React.useMemo<DiaryEntryWithMood[]>(() => {
    return entries.map((entry) => {
      const entryDate = resolveEntryDate(entry);
      if (!entryDate) {
        return entry as DiaryEntryWithMood;
      }

      const entryLocalDate = getLocalDateString(entryDate, timezone);

      const matchedMood = moodLogs.find((log) => {
        const logLocalDate = getLocalDateString(
          new Date(log.createdAt),
          timezone,
        );
        return logLocalDate === entryLocalDate;
      });

      if (!matchedMood) {
        return entry as DiaryEntryWithMood;
      }

      return {
        ...entry,
        mood: clampMoodScore(matchedMood.moodScore),
      };
    });
  }, [entries, moodLogs, timezone]);

  const selectedEntryWithMood = React.useMemo<DiaryEntryWithMood | null>(() => {
    if (!selectedEntry) return null;
    return (
      entriesWithMood.find((entry) => entry.id === selectedEntry.id) ?? null
    );
  }, [entriesWithMood, selectedEntry]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
        background: C.paperL,
      }}
    >
      <div
        style={{
          padding: "10px 10px 8px",
          borderBottom: `1px solid ${C.bdL}`,
          background: C.paper,
          position: "sticky",
          top: 0,
          zIndex: mobileMode ? 5 : 2,
          overflow: "visible",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 800,
                color: C.inkD,
                lineHeight: 1.2,
              }}
            >
              Riwayat Diary
            </p>
          </div>

          <div style={{ flex: 1 }} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto auto",
            gap: 6,
            alignItems: "center",
            position: "relative",
            zIndex: mobileMode ? 6 : 2,
            overflow: "visible",
          }}
        >
          <div
            style={{
              position: "relative",
              zIndex: mobileMode ? 7 : 2,
              overflow: "visible",
              minWidth: 0,
            }}
          >
            <CalendarDropdown
              date={selectedDate}
              monthLabel={activeMonth}
              onChange={(d) => onSelectDate(d)}
            />
          </div>

          <MonthNavButton
            direction="prev"
            onClick={onPrevMonth}
            ariaLabel="Bulan sebelumnya"
          />
          <MonthNavButton
            direction="next"
            onClick={onNextMonth}
            ariaLabel="Bulan berikutnya"
          />
        </div>
      </div>

      <div
        style={{
          padding: "8px 10px",
          borderBottom: `1px solid ${C.bdL}`,
          background: C.paper,
          display: "flex",
          flexDirection: "column",
          gap: 7,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onGoToToday}
          style={{
            width: "100%",
            height: 36,
            borderRadius: 11,
            border: "none",
            background: `linear-gradient(135deg, ${C.inkD}, ${C.inkM})`,
            color: C.white,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 8px 18px rgba(26,150,136,0.14)",
          }}
        >
          Pergi ke Hari Ini
        </button>

        <button
          type="button"
          onClick={canOpenQuiz ? onOpenQuiz : undefined}
          style={{
            width: "100%",
            minHeight: 36,
            borderRadius: 11,
            border: `1px solid ${canOpenQuiz ? C.bd : C.bdL}`,
            background: canOpenQuiz ? C.inkS : "#F7F8F8",
            color: canOpenQuiz ? C.ink : C.sub,
            fontSize: 11,
            fontWeight: 700,
            cursor: canOpenQuiz ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 11px",
            opacity: canOpenQuiz ? 1 : 0.7,
          }}
        >
          <HelpCircle size={14} color={canOpenQuiz ? C.ink : C.sub} />
          <span>Brave Choice Quiz</span>
          <div style={{ flex: 1 }} />
          {user.plan === "free" ? (
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: isQuestionPoolExhausted
                  ? C.amber
                  : canOpenQuiz
                    ? C.ink
                    : C.redD,
                padding: "3px 7px",
                borderRadius: 999,
                background: isQuestionPoolExhausted
                  ? C.goldS
                  : canOpenQuiz
                    ? C.inkT
                    : C.redL,
                border: `1px solid ${
                  isQuestionPoolExhausted
                    ? C.goldL
                    : canOpenQuiz
                      ? C.bd
                      : "#F7B6B6"
                }`,
                whiteSpace: "nowrap",
              }}
            >
              {isQuestionPoolExhausted
                ? "HABIS"
                : `${quizRemaining}/${planCfg.quizPerDay}`}
            </span>
          ) : (
            <Crown size={13} color={C.gold} />
          )}
        </button>

        {isQuestionPoolExhausted ? (
          <div
            style={{
              padding: "7px 9px",
              borderRadius: 10,
              background: C.goldS,
              border: `1px solid ${C.goldL}`,
              display: "flex",
              gap: 7,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle
              size={13}
              color={C.amber}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 9,
                lineHeight: 1.45,
                color: C.amber,
                fontWeight: 600,
              }}
            >
              Semua soal sudah selesai. Buka Brave Choice Quiz untuk reset soal
              jika ingin mengulang.
            </p>
          </div>
        ) : null}

        {!canDoQuiz && user.plan === "free" ? (
          <div
            style={{
              padding: "7px 9px",
              borderRadius: 10,
              background: C.redL,
              border: `1px solid #F5BBBB`,
              display: "flex",
              gap: 7,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle
              size={13}
              color={C.red}
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 9,
                lineHeight: 1.45,
                color: C.redD,
                fontWeight: 600,
              }}
            >
              Kuota quiz hari ini habis. Upgrade ke Premium untuk akses
              unlimited.
            </p>
          </div>
        ) : null}

        {!canDoQuiz && user.plan === "free" ? (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/subscription";
            }}
            style={{
              width: "100%",
              height: 34,
              borderRadius: 10,
              border: `1px solid ${C.goldL}`,
              background: C.goldS,
              color: C.amber,
              fontSize: 10,
              fontWeight: 800,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Crown size={12} color={C.gold} />
            Upgrade Premium
          </button>
        ) : null}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: C.paperL,
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: C.paperL,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              padding: "6px 10px 10px",
              display: "flex",
              flexDirection: "column",
              gap: ENTRY_GAP,
              background: C.paperL,
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {entriesWithMood.length > 0 ? (
              entriesWithMood.map((entry) => (
                <div key={entry.id} style={{ flexShrink: 0 }}>
                  <EntryCard
                    entry={entry}
                    isActive={selectedEntryWithMood?.id === entry.id}
                    onClick={() => onSelectEntry(entry)}
                  />
                </div>
              ))
            ) : (
              <div
                style={{
                  border: `1px solid ${C.bdL}`,
                  background: C.white,
                  borderRadius: 12,
                  padding: "14px 12px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: C.inkD,
                  }}
                >
                  Belum ada entri diary
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    color: C.sub,
                    lineHeight: 1.55,
                    fontStyle: "italic",
                  }}
                >
                  Coba pilih tanggal lain atau kembali ke hari ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "10px 12px",
          borderTop: `1px solid ${C.bdL}`,
          background: C.paper,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
          flexShrink: 0,
          zIndex: 5,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            color: C.muted,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          <Flame size={20} color={C.orange} />
          <span>
            Streak{" "}
            <strong style={{ color: C.ink }}>{user.streakDays} hari</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthNavButton({
  direction,
  onClick,
  ariaLabel,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      style={{
        width: 30,
        height: 30,
        borderRadius: 10,
        border: `1px solid ${C.bdL}`,
        background: C.white,
        color: C.ink,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(13,70,70,0.05)",
        position: "relative",
        zIndex: 2,
        flexShrink: 0,
      }}
    >
      {direction === "prev" ? (
        <ChevronLeft size={14} color={C.ink} />
      ) : (
        <ChevronRight size={14} color={C.ink} />
      )}
    </button>
  );
}
