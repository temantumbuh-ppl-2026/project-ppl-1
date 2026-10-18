"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, CreditCard, LogOut, User } from "lucide-react";

import "./home-dashboard-redesign.css";

import { authClient } from "@/lib/auth-client";
import type {
  BaselineResponse,
  MoodLog,
  SessionUser,
  WeekData,
} from "../types";

import {
  buildWeekForDate,
  computeLongestStreak,
  getStartOfWeek,
  getTimezone,
} from "../utils";
import { PageLoader } from "@/components/ui/manual/page-loader";
import { LogoutConfirmDialog } from "@/components/ui/manual/logout-confirm-dialog";
import { HomeDashboardWelcome } from "./HomeDashboardWelcome";
import { HomeDashboardActivity } from "./HomeDashboardActivity";
import { HomeDashboardMoodHistory } from "./HomeDashboardMoodHistory";
import { MOOD_HISTORY_MIN_DATE } from "./WeekFilterBar";
import { HomeDashboardBraveChoiceCard } from "./HomeDashboardBraveChoiceCard";
import { HomeDashboardInsightCard } from "./HomeDashboardInsightCard";
import { HomeDashboardBaselineCard } from "./HomeDashboardBaselineCard";

export function HomeDashboardContent() {
  const queryClient = useQueryClient();
  const [timezone] = useState(() => getTimezone());
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const today = useMemo(() => new Date(), []);

  const dateStr = useMemo(
    () =>
      today.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [today],
  );

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession().then((r) => r.data),
    staleTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const sessionUser = sessionData?.user as SessionUser | undefined;

  useEffect(() => {
    if (!sessionUser?.id) return;
    const syncStreak = async () => {
      try {
        const res = await fetch("/api/mood/streak", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timezone }),
        });
        if (!res.ok) throw new Error("Failed to sync streak");
        await queryClient.invalidateQueries({ queryKey: ["session"] });
        await queryClient.refetchQueries({
          queryKey: ["session"],
          type: "active",
        });
      } catch (error) {
        console.error(error);
      }
    };
    void syncStreak();
  }, [sessionUser?.id, timezone, queryClient]);

  const {
    data: moodLogs = [],
    isLoading: moodLogsLoading,
    isError: moodLogsError,
    isFetching: moodLogsFetching,
    refetch: refetchMoodLogs,
  } = useQuery<MoodLog[]>({
    queryKey: ["mood-logs"],
    queryFn: async () => {
      const res = await fetch("/api/mood", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch mood logs");
      const json = (await res.json()) as { success: boolean; data: MoodLog[] };
      return json.data ?? [];
    },
    enabled: !!sessionUser?.id,
    staleTime: 30_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const { data: totalDiaries = 0, isLoading: diariesLoading } = useQuery({
    queryKey: ["total-diaries"],
    queryFn: async () => {
      const res = await fetch("/api/diary/count", { cache: "no-store" });
      if (!res.ok) return 0;
      const json = await res.json();
      return json.data?.count ?? 0;
    },
    enabled: !!sessionUser?.id,
  });

  const { data: baseline = null, isLoading: baselineLoading } =
    useQuery<BaselineResponse>({
      queryKey: ["baseline"],
      queryFn: async () => {
        const res = await fetch("/api/baseline", { cache: "no-store" });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          success: boolean;
          baseline: BaselineResponse;
        };
        return json.baseline ?? null;
      },
      enabled: !!sessionUser?.id,
      staleTime: 300_000,
    });

  const { data: braveChoiceStats = null, isLoading: braveChoiceLoading } =
    useQuery({
      queryKey: ["brave-choice-stats"],
      queryFn: async () => {
        const res = await fetch(
          `/api/diary/brave-choice/stats?timezone=${timezone}`,
          { cache: "no-store" },
        );
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
      },
      enabled: !!sessionUser?.id,
    });

  // Tanggal pilihan menentukan minggu yang ditampilkan, sehingga tanggal di
  // bulan/tahun mana pun (lewat datepicker) langsung berpindah ke periodenya.
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const currentWeek: WeekData = useMemo(
    () => buildWeekForDate(moodLogs, timezone, selectedDate, today),
    [moodLogs, timezone, selectedDate, today],
  );

  const streakWeek = useMemo(
    () => buildWeekForDate(moodLogs, timezone, today, today).days,
    [moodLogs, timezone, today],
  );

  const isCurrentWeek = currentWeek.days.some((d) => d.today);
  const disablePrev =
    getStartOfWeek(selectedDate).getTime() <= MOOD_HISTORY_MIN_DATE.getTime();

  const longestStreak = computeLongestStreak(moodLogs, timezone);
  const currentStreak = sessionUser?.currentStreak ?? 0;
  const isPremium = sessionUser?.isPremium ?? false;
  const braveChoice = braveChoiceStats ?? { pct: 0, correct: 0, total: 0 };

  const isLoading =
    sessionLoading ||
    moodLogsLoading ||
    diariesLoading ||
    baselineLoading ||
    braveChoiceLoading;

  const clampToRange = (date: Date) => {
    if (date > today) return new Date(today);
    if (date < MOOD_HISTORY_MIN_DATE) return new Date(MOOD_HISTORY_MIN_DATE);
    return date;
  };

  const shiftWeek = (direction: -1 | 1) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction * 7);
    setSelectedDate(clampToRange(next));
  };

  const handlePrevWeek = () => {
    if (disablePrev) return;
    shiftWeek(-1);
  };

  const handleNextWeek = () => {
    if (isCurrentWeek) return;
    shiftWeek(1);
  };

  const handlePickDate = (date: Date) => {
    setSelectedDate(clampToRange(date));
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const userImageSrc =
    typeof sessionUser?.image === "string" && sessionUser.image.trim() !== ""
      ? sessionUser.image
      : null;

  const userInitials = sessionUser?.name
    ? sessionUser.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  if (isLoading) {
    return <PageLoader message="Memuat dashboard..." />;
  }

  return (
    <div className="tt-dash">
      <div className="dash-scroll tt-dashboard-scroll-y">
        {/* Topbar desktop; di mobile profil & menu ada di bar shell existing. */}
        <header className="dash-topbar">
          <div className="dash-page-title">
            <span>TemanTumbuh</span>
            <strong>Dashboard</strong>
          </div>
          <ProfileDropdown
            userName={sessionUser?.name ?? "Pengguna"}
            userEmail={sessionUser?.email ?? ""}
            userImageSrc={userImageSrc}
            userInitials={userInitials}
            isLoggingOut={isLoggingOut}
            onLogout={() => setShowLogoutConfirm(true)}
          />
        </header>

        <div className="dash-content">
          <HomeDashboardWelcome
            userName={sessionUser?.name ?? "Teman"}
            dateLabel={dateStr}
          />

          <HomeDashboardActivity
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            totalDiaries={totalDiaries}
            streakWeek={streakWeek}
          />

          <HomeDashboardMoodHistory
            week={currentWeek}
            today={today}
            selectedDate={selectedDate}
            onSelectDay={setSelectedDate}
            onPickDate={handlePickDate}
            onPrev={handlePrevWeek}
            onNext={handleNextWeek}
            onToday={() => setSelectedDate(new Date(today))}
            disablePrev={disablePrev}
            disableNext={isCurrentWeek}
            isFetching={moodLogsFetching}
            isError={moodLogsError}
            onRetry={() => void refetchMoodLogs()}
          />

          <section
            className="supporting-features"
            aria-labelledby="support-title"
          >
            <div className="dash-section-header">
              <div>
                <span className="dash-kicker">Fitur pendukung</span>
                <h2 id="support-title">Jelajahi saat kamu siap</h2>
              </div>
            </div>
            <div className="support-grid">
              <HomeDashboardBraveChoiceCard
                correct={braveChoice.correct}
                total={braveChoice.total}
                pct={braveChoice.pct}
                userId={sessionUser?.id}
                plan={isPremium ? "premium" : "free"}
              />
              <HomeDashboardInsightCard isPremium={isPremium} />
              <HomeDashboardBaselineCard baseline={baseline} />
            </div>
          </section>
        </div>
      </div>

      <LogoutConfirmDialog
        open={showLogoutConfirm}
        onConfirm={() => void handleLogout()}
        onCancel={() => setShowLogoutConfirm(false)}
        loading={isLoggingOut}
      />
    </div>
  );
}

// ─── Profile Dropdown ─────────────────────────────────────────────────────────

function ProfileDropdown({
  userName,
  userEmail,
  userImageSrc,
  userInitials,
  isLoggingOut,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  userImageSrc: string | null;
  userInitials: string;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const avatar = (
    <span className="profile-avatar" aria-hidden="true">
      {userImageSrc ? (
        <Image
          src={userImageSrc}
          alt=""
          width={36}
          height={36}
          referrerPolicy="no-referrer"
        />
      ) : (
        userInitials
      )}
    </span>
  );

  return (
    <div ref={dropdownRef} className="profile-menu">
      <button
        type="button"
        className="profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu profil ${userName}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        {avatar}
        <strong>{userName}</strong>
        <ChevronDown size={15} aria-hidden="true" />
      </button>

      {open ? (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-head">
            {avatar}
            <p>
              <strong>{userName}</strong>
              {userEmail ? <small>{userEmail}</small> : null}
            </p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            className="profile-dropdown-item"
            onClick={() => setOpen(false)}
          >
            <User size={15} aria-hidden="true" /> Lihat Profil
          </Link>
          <Link
            href="/subscription"
            role="menuitem"
            className="profile-dropdown-item"
            onClick={() => setOpen(false)}
          >
            <CreditCard size={15} aria-hidden="true" /> Kelola langganan
          </Link>
          <button
            type="button"
            role="menuitem"
            className="profile-dropdown-item danger"
            disabled={isLoggingOut}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut size={15} aria-hidden="true" /> Keluar
          </button>
        </div>
      ) : null}
    </div>
  );
}
