"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DiaryEntry,
  ChatMessage,
  DiaryConversation,
  DiaryConversationStarter,
  PlanConfig,
  UserProfile,
} from "../types";
import { PLAN_CONFIG } from "../constants/planConfig";
import {
  getDiaryEntries,
  getDiaryConversationStarters,
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
  const [conversation, setConversation] = useState<DiaryConversation | null>(
    null,
  );
  const [starters, setStarters] = useState<DiaryConversationStarter[]>([]);
  const [startersError, setStartersError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isGreetingPending, setIsGreetingPending] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSendStatusUnknown, setIsSendStatusUnknown] = useState(false);

  const [activeMonthKey, setActiveMonthKey] = useState(initialMonthKey);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);

  const initialEntryIdRef = useRef(entryId);
  const hasResolvedInitialEntryRef = useRef(false);
  const pendingCalendarSelectionRef = useRef<Date | undefined>(undefined);
  const skipNextMessagesFetchEntryIdRef = useRef<string | null>(null);
  const sendInFlightRef = useRef(false);
  const viewEpochRef = useRef(0);

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

    getDiaryConversationStarters()
      .then((loadedStarters) => {
        if (!ignore) setStarters(loadedStarters);
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setStartersError(
            error instanceof Error
              ? error.message
              : "Gagal memuat pilihan awal cerita.",
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadEntries() {
      setIsLoading(true);
      setIsMonthLoading(true);

      // Reset list dan chat saat pindah bulan supaya state lama tidak bocor.
      setEntries([]);
      setSelectedEntry(null);
      setMessages([]);
      setConversation(null);
      setIsGreetingPending(false);

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
        setConversation(null);
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
      setConversation(null);
      if (!isSendStatusUnknown) setSendError(null);
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
      setConversation(null);
      return;
    }

    setSelectedEntry((prev) => {
      if (prev?.id === nextEntry?.id) return prev;
      return nextEntry;
    });
  }, [entries, selectedDate, today, isMonthLoading, isSendStatusUnknown]);

  const selectedEntryId = selectedEntry?.id;
  useEffect(() => {
    let ignore = false;

    async function loadMessages() {
      if (!selectedEntryId) {
        setMessages([]);
        setConversation(null);
        setIsGreetingPending(false);
        setIsMessagesLoading(false);
        return;
      }

      if (skipNextMessagesFetchEntryIdRef.current === selectedEntryId) {
        skipNextMessagesFetchEntryIdRef.current = null;
        setIsMessagesLoading(false);
        return;
      }

      setIsMessagesLoading(true);
      setConversation(null);
      setIsGreetingPending(false);

      try {
        const { messages: diaryMessages, conversation: diaryConversation } =
          await getDiaryMessages(selectedEntryId);

        if (ignore) return;
        setMessages(diaryMessages);
        setConversation(diaryConversation);

        setIsGreetingPending(
          diaryMessages.length === 0 && selectedEntryId !== "today",
        );
      } catch (error) {
        console.error("Failed to load diary messages:", error);

        if (ignore) return;
        setMessages([]);
        setConversation(null);
        setIsGreetingPending(false);
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
    let inFlight = false;
    let attempts = 0;

    if (
      isGreetingPending &&
      selectedEntryId &&
      selectedEntryId !== "today" &&
      messages.length === 0 &&
      !isAiTyping
    ) {
      const interval = window.setInterval(async () => {
        if (inFlight) return;
        inFlight = true;
        attempts += 1;

        try {
          const { messages: diaryMessages, conversation: diaryConversation } =
            await getDiaryMessages(selectedEntryId);
          if (ignore || sendInFlightRef.current) return;
          if (diaryMessages.length > 0) {
            setMessages(diaryMessages);
            setConversation(diaryConversation);
            setIsGreetingPending(false);
          }
        } catch (err) {
          console.error("Polling diary messages failed:", err);
        } finally {
          inFlight = false;
          if (!ignore && attempts >= 20) {
            setIsGreetingPending(false);
          }
        }
      }, 3000);

      return () => {
        ignore = true;
        window.clearInterval(interval);
      };
    }

    return () => {
      ignore = true;
    };
  }, [isAiTyping, isGreetingPending, selectedEntryId, messages.length]);

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
  const canWriteDiary =
    user?.plan === "premium" ||
    (selectedEntry?.isToday === true && selectedEntry.id !== "today") ||
    diaryRemaining > 0;

  async function handleSendMessage() {
    if (
      !selectedEntry ||
      !inputValue.trim() ||
      !canWriteDiary ||
      isMessagesLoading ||
      isSendStatusUnknown ||
      sendInFlightRef.current
    ) {
      return;
    }

    sendInFlightRef.current = true;
    const requestedEntryId = selectedEntry.id;
    const viewEpoch = viewEpochRef.current;
    const isCurrentView = () => viewEpochRef.current === viewEpoch;
    const userText = inputValue.trim();
    const previousMessages = messages;
    const previousMatchingMessages = messages.filter(
      (message) => message.role === "user" && message.text === userText,
    ).length;
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

    setMessages([...messages, newUserMessage]);
    setInputValue("");
    setIsGreetingPending(false);
    setIsAiTyping(true);

    try {
      const result = await sendChatMessageStream(requestedEntryId, userText, {
        onChunk: (textChunk) => {
          if (!textChunk || !isCurrentView()) {
            return;
          }

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

      if (!isCurrentView()) return;

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
      setConversation(result.conversation ?? null);
      setEntries((prev) => upsertEntryByDate(prev, result.entry));

      if (requestedEntryId !== result.entry.id) {
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

      try {
        const latest = await getDiaryMessages(requestedEntryId);
        if (!isCurrentView()) return;

        setMessages(latest.messages);
        setConversation(latest.conversation);

        const matchingSavedMessages = latest.messages.filter(
          (item) => item.role === "user" && item.text === userText,
        ).length;
        const wasPersisted = matchingSavedMessages > previousMatchingMessages;

        if (wasPersisted) {
          if (requestedEntryId === "today") {
            try {
              const refreshed = await getDiaryEntries(activeMonthKey);
              if (!isCurrentView()) return;

              setEntries(refreshed.entries);
              setUser((prev) =>
                prev
                  ? {
                      ...prev,
                      diarySessionsUsedThisMonth:
                        refreshed.diarySessionsUsedThisMonth,
                    }
                  : prev,
              );

              const persistedEntry = refreshed.entries.find(
                (entry) => entry.isToday && entry.id !== "today",
              );
              if (persistedEntry) {
                skipNextMessagesFetchEntryIdRef.current = persistedEntry.id;
                setSelectedEntry(persistedEntry);
              }
            } catch {
              // The saved conversation is already visible; the entry list can
              // refresh when the page is opened again.
            }
          }
          return;
        }

        setInputValue(userText);
        setSendError(message);
        if (latest.messages.length === 0 && requestedEntryId !== "today") {
          setIsGreetingPending(true);
        }
      } catch {
        if (!isCurrentView()) return;

        setMessages(previousMessages);
        setInputValue(userText);
        setIsSendStatusUnknown(true);
        setSendError(
          `${message} Status pesan belum dapat diperiksa. Muat ulang diary sebelum mencoba lagi.`,
        );
      }
    } finally {
      sendInFlightRef.current = false;
      setIsAiTyping(false);
    }
  }

  function handleInputChange(value: string) {
    setInputValue(value);

    if (value.trim().length > 0 && !isSendStatusUnknown) {
      setSendError(null);
    }
  }

  function handleKeyDown() {}

  function selectEntry(entry: DiaryEntry) {
    viewEpochRef.current += 1;
    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = undefined;
    if (!isSendStatusUnknown) setSendError(null);

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
    viewEpochRef.current += 1;
    if (!isSendStatusUnknown) setSendError(null);
    const now = new Date();

    hasResolvedInitialEntryRef.current = true;
    initialEntryIdRef.current = undefined;
    pendingCalendarSelectionRef.current = undefined;

    setSelectedDate(now);
    setActiveMonthKey(formatMonthKey(now));
  }

  function goToPrevMonth() {
    viewEpochRef.current += 1;
    if (!isSendStatusUnknown) setSendError(null);
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
    viewEpochRef.current += 1;
    if (!isSendStatusUnknown) setSendError(null);
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
    viewEpochRef.current += 1;
    if (!isSendStatusUnknown) setSendError(null);
    setSelectedDate(date);

    if (!date) {
      setSelectedEntry(null);
      setMessages([]);
      setConversation(null);
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
      setConversation(null);
    }

    pendingCalendarSelectionRef.current = undefined;
  }

  return {
    isLoading,
    isMonthLoading,
    user,
    entries,
    messages,
    conversation,
    starters,
    startersError,
    selectedEntry,
    activeMonth,
    activeMonthKey,
    selectedDate,
    inputValue,
    isAiTyping,
    isGreetingPending,
    isMessagesLoading,
    sendError,
    isSendStatusUnknown,
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
