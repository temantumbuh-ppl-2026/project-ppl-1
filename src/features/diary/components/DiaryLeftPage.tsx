"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Flame,
  Info,
  PanelLeftClose,
  X,
} from "lucide-react";

import type { DiaryEntry, UserProfile, PlanConfig } from "../types";
import { EntryCard } from "./EntryCard";
import { CalendarDropdown } from "@/components/ui/manual/calendar-dropdown";

type Props = {
  /** Drawer riwayat terbuka (tablet/mobile). */
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  onToggleCollapse: () => void;
  onBack: () => void;
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
  isDrawerOpen,
  onCloseDrawer,
  onToggleCollapse,
  onBack,
  user,
  entries,
  selectedEntry,
  activeMonth,
  selectedDate,
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
  const timezone = React.useMemo(() => getTimezone(), []);
  const canOpenQuiz = canDoQuiz || isQuestionPoolExhausted;
  const isFree = user.plan === "free";

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

  return (
    <aside
      id="diary-history"
      className={`dy-sidebar ${isDrawerOpen ? "is-open" : ""}`}
      aria-label="Riwayat diary"
    >
      <div className="dy-sidebar-top">
        <button type="button" className="dy-back" onClick={onBack}>
          <ChevronLeft size={16} aria-hidden="true" />
          Kembali
        </button>
        <button
          type="button"
          className="dy-icon-btn dy-collapse-btn"
          onClick={onToggleCollapse}
          aria-label="Ciutkan riwayat diary"
          title="Ciutkan riwayat diary"
        >
          <PanelLeftClose size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="dy-icon-btn dy-drawer-close"
          onClick={onCloseDrawer}
          aria-label="Tutup riwayat diary"
          title="Tutup riwayat diary"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="dy-sidebar-content">
        <h2 className="dy-sidebar-heading">Riwayat Diary</h2>

        <div
          className="dy-date-compact"
          role="group"
          aria-label="Navigasi tanggal diary"
        >
          <div className="dy-date-picker">
            <CalendarDropdown
              date={selectedDate}
              monthLabel={activeMonth}
              onChange={(date) => {
                onSelectDate(date);
                if (date) onCloseDrawer();
              }}
            />
          </div>
          <button
            type="button"
            className="dy-square-btn"
            onClick={onPrevMonth}
            aria-label="Bulan sebelumnya"
            title="Bulan sebelumnya"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="dy-today-btn"
            onClick={() => {
              onGoToToday();
              onCloseDrawer();
            }}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className="dy-square-btn"
            onClick={onNextMonth}
            aria-label="Bulan berikutnya"
            title="Bulan berikutnya"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          className="dy-brave"
          aria-disabled={!canOpenQuiz}
          onClick={
            canOpenQuiz
              ? () => {
                  onOpenQuiz();
                  onCloseDrawer();
                }
              : undefined
          }
        >
          <Compass size={18} aria-hidden="true" />
          <span>Brave Choice</span>
          {isFree ? (
            <span
              className={`dy-brave-badge ${
                isQuestionPoolExhausted || !canOpenQuiz ? "is-warn" : ""
              }`}
            >
              {isQuestionPoolExhausted ? "Selesai" : `Sisa ${quizRemaining}`}
            </span>
          ) : (
            <Crown
              size={16}
              aria-label="Premium"
              style={{ marginLeft: "auto" }}
            />
          )}
        </button>

        {isQuestionPoolExhausted ? (
          <p className="dy-note">
            <Info size={14} aria-hidden="true" />
            <span>
              Semua situasi sudah kamu jelajahi. Buka Brave Choice untuk
              mengulang dari awal.
            </span>
          </p>
        ) : null}

        {!canDoQuiz && isFree ? (
          <>
            <p className="dy-note">
              <Info size={14} aria-hidden="true" />
              <span>
                Kesempatan Brave Choice hari ini sudah habis. Lanjut besok, atau
                buka akses tanpa batas dengan Premium.
              </span>
            </p>
            <Link href="/subscription" className="dy-premium-btn">
              <Crown size={14} aria-hidden="true" />
              Upgrade Premium
            </Link>
          </>
        ) : null}

        <span className="dy-list-label">Riwayat entri</span>
        <div className="dy-entry-list">
          {entriesWithMood.length > 0 ? (
            entriesWithMood.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                isActive={selectedEntry?.id === entry.id}
                onClick={() => {
                  onSelectEntry(entry);
                  onCloseDrawer();
                }}
              />
            ))
          ) : (
            <div className="dy-empty-list">
              <strong>Belum ada entri diary</strong>
              <span>Coba pilih tanggal lain atau kembali ke hari ini.</span>
            </div>
          )}
        </div>
      </div>

      <div className="dy-streak">
        <Flame size={20} aria-hidden="true" />
        <span>
          <strong>Streak {user.streakDays} hari</strong>
          Pelan-pelan tetap berarti.
        </span>
      </div>
    </aside>
  );
}
