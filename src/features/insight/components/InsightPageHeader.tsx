"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  LogOut,
  Sparkles,
  User,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { DateButton, IconButton, PillButton } from "./insight-primitives";
import { formatDateID, getRelativeLabel } from "../lib/insight-utils";

export function InsightPageHeader({
  effectiveDate,
  availableDates,
  currentIndex,
  dateInputRef,
  isToday,
  hasInsight,
  isGenerating,
  onGenerateTodayInsight,
  onPrevDate,
  onNextDate,
  onDateChange,
}: {
  effectiveDate: string;
  availableDates: string[];
  currentIndex: number;
  dateInputRef: React.RefObject<HTMLInputElement | null>;
  isToday: boolean;
  hasInsight: boolean;
  isGenerating: boolean;
  onGenerateTodayInsight: () => void;
  onPrevDate: () => void;
  onNextDate: () => void;
  onDateChange: (newDate: string) => void;
}) {
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.user?.name) setUserName(data.user.name);
        if (data?.user?.image) setUserImage(data.user.image);
      } catch {
        /* ignore */
      }
    };
    void fetchSession();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/login";
          },
        },
      });
    } catch {
      setIsLoggingOut(false);
    }
  };

  const userInitials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  const disabled = hasInsight || isGenerating;

  const handleInsightClick = () => {
    if (disabled) return;
    setShowConfirm(true);
  };

  const handleConfirmGenerate = () => {
    setShowConfirm(false);
    onGenerateTodayInsight();
  };

  return (
    <>
      <div
        className="mb-5 flex flex-col gap-4"
        style={{
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
        }}
      >
        {/* Row 1: Title left, actions + profile right — always same row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1
              className="text-[24px] font-bold leading-tight tracking-[-0.02em] sm:text-[32px] md:text-[38px]"
              style={{ color: "var(--tt-dashboard-text)" }}
            >
              Insight Harian
            </h1>
            <p
              className="mt-1 text-[12px] leading-5 sm:text-sm"
              style={{ color: "var(--tt-dashboard-text-2)" }}
            >
              Ringkasan mood, pola, dan saran harianmu.
            </p>
          </div>

          {/* Right: Insight button + info + profile */}
          <div className="flex shrink-0 items-center gap-2">
            {isToday && (
              <>
                <button
                  type="button"
                  onClick={handleInsightClick}
                  disabled={disabled}
                  className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-semibold transition-all sm:px-4 sm:text-[12px] ${disabled ? "cursor-not-allowed opacity-70" : "hover:translate-y-[-1px]"}`}
                  style={{
                    background: disabled
                      ? "#E8F2F0"
                      : "var(--gradient-brand-btn)",
                    color: disabled ? "var(--tt-dashboard-text-2)" : "#FFFFFF",
                    boxShadow: disabled
                      ? "none"
                      : "0 8px 18px rgba(26,150,136,0.20)",
                  }}
                >
                  {isGenerating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  <span className="hidden sm:inline">
                    {hasInsight ? "Tersedia" : "Tampilkan Insight"}
                  </span>
                  <span className="sm:hidden">
                    {hasInsight ? "Tersedia" : "Insight"}
                  </span>
                </button>

                {/* Info tooltip */}
                <InfoTooltip />
              </>
            )}

            {/* Profile dropdown — desktop */}
            {userName && (
              <div ref={profileRef} className="relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => setProfileOpen((p) => !p)}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1.5 transition-colors"
                  style={{ background: "var(--tt-dashboard-chip-bg)" }}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[10px] font-black text-white"
                    style={{ background: "var(--tt-dashboard-brand)" }}
                  >
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={userName}
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <span
                    className="text-[12px] font-bold"
                    style={{ color: "var(--tt-dashboard-text)" }}
                  >
                    {userName}
                  </span>
                  <ChevronDown
                    size={13}
                    style={{
                      color: "var(--tt-dashboard-text-2)",
                      transform: profileOpen ? "rotate(180deg)" : "rotate(0)",
                      transition: "transform 0.2s",
                    }}
                  />
                </button>

                {profileOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border shadow-lg"
                    style={{
                      background: "rgba(255,255,255,0.98)",
                      borderColor: "var(--tt-dashboard-card-border)",
                    }}
                  >
                    <Link
                      href="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex cursor-pointer items-center gap-2.5 px-4 py-3 text-[13px] font-semibold transition-colors hover:bg-[rgba(26,150,136,0.06)]"
                      style={{ color: "var(--tt-dashboard-text)" }}
                    >
                      <User
                        size={15}
                        style={{ color: "var(--tt-dashboard-brand)" }}
                      />{" "}
                      Lihat Profil
                    </Link>
                    <div
                      className="mx-3 h-px"
                      style={{ background: "var(--tt-dashboard-card-border)" }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        void handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-[13px] font-semibold transition-colors hover:bg-[rgba(239,68,68,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ color: "#DC2626" }}
                    >
                      <LogOut size={15} /> Keluar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Date navigation — right aligned */}
        <div className="flex items-center justify-end gap-2">
          <IconButton
            onClick={onPrevDate}
            disabled={currentIndex <= 0}
            ariaLabel="Hari sebelumnya"
          >
            <ChevronLeft size={16} />
          </IconButton>

          <PillButton active>
            {getRelativeLabel(effectiveDate, availableDates)}
          </PillButton>

          <DateButton
            label={formatDateID(effectiveDate)}
            onClick={() =>
              dateInputRef.current?.showPicker?.() ??
              dateInputRef.current?.click()
            }
          />

          <input
            ref={dateInputRef}
            type="date"
            value={effectiveDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="sr-only"
          />

          <IconButton
            onClick={onNextDate}
            disabled={currentIndex >= availableDates.length - 1}
            ariaLabel="Hari berikutnya"
          >
            <ChevronRight size={16} />
          </IconButton>
        </div>
      </div>

      {/* Confirmation popup */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-4"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-2xl"
            style={{ borderColor: "rgba(25,39,44,0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ background: "rgba(26,150,136,0.12)" }}
              >
                <Sparkles
                  size={18}
                  style={{ color: "var(--tt-dashboard-brand)" }}
                />
              </div>
              <h3
                className="text-[16px] font-bold"
                style={{ color: "var(--tt-dashboard-text)" }}
              >
                Tampilkan Insight?
              </h3>
            </div>

            <p
              className="text-[13px] leading-6 mb-5"
              style={{ color: "var(--tt-dashboard-text-2)" }}
            >
              Insight hanya bisa ditampilkan <strong>1 kali per hari</strong>.
              Pastikan kamu sudah selesai bercerita di TemanCerita agar hasilnya
              lebih akurat.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmGenerate}
                className="flex-1 h-11 cursor-pointer rounded-xl text-[13px] font-semibold text-white transition-all hover:translate-y-[-1px]"
                style={{
                  background: "var(--gradient-brand-btn)",
                  boxShadow: "0 8px 18px rgba(26,150,136,0.20)",
                }}
              >
                Ya, Tampilkan
              </button>
              <Link
                href="/diary"
                className="flex flex-1 h-11 cursor-pointer items-center justify-center rounded-xl border text-[13px] font-semibold transition-all hover:translate-y-[-1px]"
                style={{
                  borderColor: "rgba(25,39,44,0.10)",
                  color: "var(--tt-dashboard-text)",
                }}
              >
                Masih Mau Cerita
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Info Tooltip ─────────────────────────────────────────────────────────────

function InfoTooltip() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[rgba(25,39,44,0.08)]"
        style={{ color: "var(--tt-dashboard-text-2)" }}
        aria-label="Info"
      >
        <Info size={14} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full z-[9999] mt-2 w-72 rounded-xl border bg-white p-4 shadow-xl"
          style={{ borderColor: "rgba(25,39,44,0.08)" }}
        >
          <p
            className="text-[13px] font-semibold mb-2"
            style={{ color: "var(--tt-dashboard-text)" }}
          >
            Tentang Insight
          </p>
          <ul
            className="list-disc space-y-1.5 pl-4 text-[12px] leading-5"
            style={{ color: "var(--tt-dashboard-text-2)" }}
          >
            <li>
              Insight hanya bisa ditampilkan <strong>1 kali per hari</strong>.
            </li>
            <li>
              Jika belum sempat hari ini, besok kamu masih bisa menampilkan
              insight untuk hari kemarin.
            </li>
            <li>
              Kamu perlu menulis di TemanCerita terlebih dahulu agar insight
              bisa dihasilkan.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
