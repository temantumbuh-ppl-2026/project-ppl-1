"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DiaryEntry,
  ChatMessage,
  PlanConfig,
  UserProfile,
} from "../types";
import { PLAN_CONFIG } from "../constants/planConfig";
import {
  getDiaryEntries,
  getDiaryMessages,
  sendChatMessageStream,
} from "../services/diaryServices";

type InitialUserMeta = {
  id: string;
  name: string;
  plan: "free" | "premium";
  streakDays: number;
  parentEmail?: string;
};

export function useDiary(entryId?: string, initialUserMeta?: InitialUserMeta) {
  const today = useMemo(() => new Date(), []);
  const initialMonthKey = formatMonthKey(today);

  const [isLoading, setIsLoading] = useState(true);
  const [isMonthLoading, setIsMonthLoading] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [activeMonthKey, setActiveMonthKey] = useState(initialMonthKey);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

  const initialEntryIdRef = useRef(entryId);
  const hasResolvedInitialEntryRef = useRef(false);
  const pendingCalendarSelectionRef = useRef<Date | undefined>(undefined);
  const skipNextMessagesFetchEntryIdRef = useRef<string | null>(null);

  const planCfg: PlanConfig = useMemo(() => {
    if (!user) {
      return PLAN_CONFIG.free;
    }

    return PLAN_CONFIG[user.plan];
  }, [user]);

  const activeMonth = useMemo(() => {
    return formatMonthLabel(activeMonthKey);
  }, [activeMonthKey]);

  useEffect(() => {
    setUser({
      id: initialUserMeta?.id ?? "unknown",
      name: initialUserMeta?.name ?? "User",
      plan: initialUserMeta?.plan ?? "free",
      diarySessionsUsedThisMonth: 0,
      quizUsedToday: 0,
      streakDays: initialUserMeta?.streakDays ?? 0,
      totalEntries: 0,
      avatarInitials: initialUserMeta?.name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    });
  }, [initialUserMeta]);

  useEffect(() => {
    let ignore = false;

    async function loadEntries() {
      setIsLoading(true);
      setIsMonthLoading(true);

      // Reset list dan chat saat pindah bulan supaya state lama tidak bocor.
      setEntries([]);
      setSelectedEntry(null);
      setMessages([]);

      try {
        const diaryEntriesResult = await getDiaryEntries(activeMonthKey);

        if (ignore) return;

        setEntries(diaryEntriesResult.entries);

        setUser((prev) =>
          prev
            ? {
                ...prev,
                totalEntries: diaryEntriesResult.entries.length,
                diarySessionsUsedThisMonth:
                  diaryEntriesResult.diarySessionsUsedThisMonth,
              }
            : prev,
        );
      } catch (error) {
        console.error("Failed to load diary entries:", error);

        if (ignore) return;

        setEntries([]);
        setMessages([]);
      } finally {
        if (!ignore) {
          setIsMonthLoading(false);
          setIsLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      ignore = true;
    };
  }, [activeMonthKey]);

  useEffect(() => {
    if (isMonthLoading) return;

    if (!entries.length) {
      setSelectedEntry(null);
      setMessages([]);
      setSendError(null);
      pendingCalendarSelectionRef.current = undefined;
      return;
    }

    let nextEntry: DiaryEntry | null = null;

    if (!hasResolvedInitialEntryRef.current && initialEntryIdRef.current) {
      nextEntry =
        entries.find((entry) => entry.id === initialEntryIdRef.current) ?? null;

      hasResolvedInitialEntryRef.current = true;

      if (nextEntry) {
        setSelectedDate(parseDateKey(nextEntry.date));
      }
    }

    const targetDate = pendingCalendarSelectionRef.current ?? selectedDate;

    if (!nextEntry && targetDate) {
      const targetDateKey = formatDateKey(targetDate);
      nextEntry =
        entries.find(
          (entry) => normalizeDateKey(entry.date) === targetDateKey,
        ) ?? null;

      if (!nextEntry && pendingCalendarSelectionRef.current) {
        const fallbackEntry = findClosestEntry(entries, targetDate);

        if (fallbackEntry) {
          if (typeof window !== "undefined") {
            window.alert(
              `Kamu tidak menulis diary di tanggal ${formatFullDate(
                targetDate,
              )}. Kami mengarahkanmu ke diary terdekat di bulan ini.`,
            );
          }

          nextEntry = fallbackEntry;
          setSelectedDate(parseDateKey(fallbackEntry.date));
        }

        pendingCalendarSelectionRef.current = undefined;
      }
    }

    if (!nextEntry) {
      const todayKey = formatDateKey(today);
      nextEntry =
        entries.find((entry) => normalizeDateKey(entry.date) === todayKey) ??
        entries.find((entry) => entry.isToday) ??
        null;
    }

    if (!nextEntry) {
      setSelectedEntry(null);
      setMessages([]);
      return;
    }

    setSelectedEntry((prev) => {
      if (prev?.id === nextEntry?.id) return prev;
      return nextEntry;
    });
  }, [entries, selectedDate, today, isMonthLoading]);

  const selectedEntryId = selectedEntry?.id;
  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      if (!selectedEntryId) {
        setMessages([]);
        setIsMessagesLoading(false);
        return;
      }

      if (skipNextMessagesFetchEntryIdRef.current === selectedEntryId) {
        skipNextMessagesFetchEntryIdRef.current = null;
        setIsMessagesLoading(false);
        return;
      }

      setIsMessagesLoading(true);

      try {
        const diaryMessages = await getDiaryMessages(selectedEntryId);

        if (ignore) return;
        setMessages(diaryMessages);

        if (diaryMessages.length === 0 && selectedEntryId !== "today") {
          setIsAiTyping(true);
        } else {
          setIsAiTyping(false);
        }
      } catch (error) {
        console.error("Failed to load diary messages:", error);

        if (ignore) return;
        setMessages([]);
      } finally {
        if (!ignore) {
          setIsMessagesLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      ignore = true;
    };
  }, [selectedEntryId]);

  useEffect(() => {
    let ignore = false;
    let interval: NodeJS.Timeout;

    if (
      isAiTyping &&
      selectedEntryId &&
      selectedEntryId !== "today" &&
      messages.length === 0
    ) {
      interval = setInterval(async () => {
        try {
          const diaryMessages = await getDiaryMessages(selectedEntryId);
          if (ignore) return;
          if (diaryMessages.length > 0) {
            setMessages(diaryMessages);
            setIsAiTyping(false);
          }
        } catch (err) {
          console.error("Polling diary messages failed:", err);
        }
      }, 3000);
    }

    return () => {
      ignore = true;
      if (interval) clearInterval(interval);
    };
  }, [isAiTyping, selectedEntryId, messages.length]);

  useEffect(() => {
    if (!selectedEntryId || typeof window === "undefined") {
      return;
    }

    const nextPath = `/diary/${selectedEntryId}`;

    if (window.location.pathname !== nextPath) {
      window.history.replaceState(window.history.state, "", nextPath);
    }
  }, [selectedEntryId]);

  const currentEntryIndex = selectedEntry
    ? entries.findIndex((entry) => entry.id === selectedEntry.id)
    : 0;

  const diaryRemaining =
    user?.plan === "premium"
      ? Infinity
      : Math.max(
          0,
          planCfg.diaryPerMonth - (user?.diarySessionsUsedThisMonth ?? 0),
        );

  const isReadOnly = selectedEntry ? !selectedEntry.isToday : true;
  const canWriteDiary = user?.plan === "premium" || diaryRemaining > 0;

  async function handleSendMessage() {
    if (
      !selectedEntry ||
      !inputValue.trim() ||
      !canWriteDiary ||
      isMessagesLoading
    ) {
      return;
    }

    const userText = inputValue.trim();
    setSendError(null);

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText,
      time: new Date()
        .toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(":", "."),
    };

    const streamingAiMessageId = `ai-stream-${Date.now()}`;
    const streamingAiMessageTime = new Date()
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(":", ".");

    const nextMessages = [...messages, newUserMessage];
    setMessages(nextMessages);
    setInputValue("");
    setIsAiTyping(true);

    try {
      const result = await sendChatMessageStream(selectedEntry.id, userText, {
        onChunk: (textChunk) => {
          if (!textChunk) {
            return;
          }

          setIsAiTyping(false);
          setMessages((prev) => {
            const existingStreamMessageIndex = prev.findIndex(
              (message) => message.id === streamingAiMessageId,
            );

            if (existingStreamMessageIndex === -1) {
              return [
                ...prev,
                {
                  id: streamingAiMessageId,
                  role: "ai",
                  text: textChunk,
                  time: streamingAiMessageTime,
                },
              ];
            }

            return prev.map((message) =>
              message.id === streamingAiMessageId
                ? {
                    ...message,
                    text: `${message.text}${textChunk}`,
                  }
                : message,
            );
          });
        },
      });

      setMessages((prev) => {
        const existingStreamMessageIndex = prev.findIndex(
          (message) => message.id === streamingAiMessageId,
        );

        if (existingStreamMessageIndex === -1) {
          return [...prev, result.aiMessage];
        }

        return prev.map((message) =>
          message.id === streamingAiMessageId ? result.aiMessage : message,
        );
      });
      setEntries((prev) => upsertEntryByDate(prev, result.entry));

      if (selectedEntry.id !== result.entry.id) {
        skipNextMessagesFetchEntryIdRef.current = result.entry.id;
        setSelectedEntry(result.entry);
      }

      setUser((prev) =>
        prev
          ? {
              ...prev,
              diarySessionsUsedThisMonth: result.diarySessionsUsedThisMonth,
            }
          : prev,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengirim pesan diary. Silakan coba lagi.";

      setMessages((prev) => {
        const withoutStreamingMessage = prev.filter(
          (item) => item.id !== streamingAiMessageId,
        );

        return [
          ...withoutStreamingMessage,
          {
            id: `ai-error-${Date.now()}`,
            role: "ai",
            text: `Maaf, balasan AI belum tersedia. ${message}`,
            time: streamingAiMessageTime,
          },
        ];
      });
      setInputValue(userText);
      setSendError(message);
    } finally {
      setIsAiTyping(false);
    }
  }

  function handleInputChange(value: string) {
    setInputValue(value);

    if (value.trim().length > 0) {
      setSendError(null);
    }
  }

  function handleKeyDown() {}

  function selectEntry(entry: DiaryEntry) {
    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = undefined;
    setSendError(null);

    setSelectedEntry(entry);
    setSelectedDate(parseDateKey(entry.date));
  }

  function goToPrevEntry() {
    if (currentEntryIndex < entries.length - 1) {
      const next = entries[currentEntryIndex + 1];
      selectEntry(next);
    }
  }

  function goToNextEntry() {
    if (currentEntryIndex > 0) {
      const next = entries[currentEntryIndex - 1];
      selectEntry(next);
    }
  }

  function goToToday() {
    const now = new Date();

    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = undefined;

    setSelectedDate(now);
    setActiveMonthKey(formatMonthKey(now));
  }

  function goToPrevMonth() {
    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = undefined;

    setActiveMonthKey((prev) => {
      const next = shiftMonthKey(prev, -1);

      setSelectedDate((current) => {
        if (!current) return parseMonthKeyToDate(next);
        return clampDateToMonth(current, next);
      });

      return next;
    });
  }

  function goToNextMonth() {
    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = undefined;

    setActiveMonthKey((prev) => {
      const next = shiftMonthKey(prev, 1);

      setSelectedDate((current) => {
        if (!current) return parseMonthKeyToDate(next);
        return clampDateToMonth(current, next);
      });

      return next;
    });
  }

  function selectCalendarDate(date: Date | undefined) {
    setSelectedDate(date);

    if (!date) {
      setSelectedEntry(null);
      setMessages([]);
      pendingCalendarSelectionRef.current = undefined;
      return;
    }

    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = date;

    const nextMonthKey = formatMonthKey(date);
    const nextDateKey = formatDateKey(date);

    if (nextMonthKey !== activeMonthKey) {
      setActiveMonthKey(nextMonthKey);
      return;
    }

    const matchedEntry =
      entries.find((entry) => normalizeDateKey(entry.date) === nextDateKey) ??
      null;

    if (matchedEntry) {
      setSelectedEntry(matchedEntry);
      pendingCalendarSelectionRef.current = undefined;
      return;
    }

    const fallbackEntry = findClosestEntry(entries, date);

    if (fallbackEntry) {
      if (typeof window !== "undefined") {
        window.alert(
          `Kamu tidak menulis diary di tanggal ${formatFullDate(
            date,
          )}. Kami mengarahkanmu ke diary terdekat di bulan ini.`,
        );
      }

      setSelectedEntry(fallbackEntry);
      setSelectedDate(parseDateKey(fallbackEntry.date));
    } else {
      setSelectedEntry(null);
      setMessages([]);
    }

    pendingCalendarSelectionRef.current = undefined;
  }

  return {
    isLoading,
    isMonthLoading,
    user,
    entries,
    messages,
    selectedEntry,
    activeMonth,
    activeMonthKey,
    selectedDate,
    inputValue,
    isAiTyping,
    isMessagesLoading,
    sendError,
    isReadOnly,
    canWriteDiary,
    currentEntryIndex,
    diaryRemaining,
    planCfg,
    setInputValue: handleInputChange,
    setSelectedEntry: selectEntry,
    handleSendMessage,
    handleKeyDown,
    goToPrevEntry,
    goToNextEntry,
    goToToday,
    goToPrevMonth,
    goToNextMonth,
    selectCalendarDate,
  };
}

function findClosestEntry(entries: DiaryEntry[], targetDate: Date) {
  if (!entries.length) return null;

  const targetTime = startOfDay(targetDate).getTime();

  const sorted = [...entries].sort((a, b) => {
    const aDiff = Math.abs(
      startOfDay(parseDateKey(a.date)).getTime() - targetTime,
    );
    const bDiff = Math.abs(
      startOfDay(parseDateKey(b.date)).getTime() - targetTime,
    );
    return aDiff - bDiff;
  });

  return sorted[0] ?? null;
}

function upsertEntryByDate(entries: DiaryEntry[], incoming: DiaryEntry) {
  const incomingDateKey = normalizeDateKey(incoming.date);

  const merged = [
    incoming,
    ...entries.filter(
      (entry) =>
        entry.id !== incoming.id &&
        normalizeDateKey(entry.date) !== incomingDateKey,
    ),
  ];

  return merged.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string) {
  const normalized = normalizeDateKey(dateKey);
  const [yearStr, monthStr, dayStr] = normalized.split("-");
  return new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));
}

function normalizeDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function shiftMonthKey(monthKey: string, delta: number) {
  const [yearStr, monthStr] = monthKey.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  return formatMonthKey(date);
}

function parseMonthKeyToDate(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  return new Date(Number(yearStr), Number(monthStr) - 1, 1);
}

function clampDateToMonth(date: Date, monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.min(date.getDate(), lastDay);

  return new Date(year, monthIndex, day);
}
