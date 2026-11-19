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
      {/* Profil — hanya desktop */}
      {(isToday || userName) && (
        <div className="ins-topbar">
          {isToday && (
            <div className="ins-actions">
              <button
                type="button"
                onClick={handleInsightClick}
                disabled={disabled}
                aria-busy={isGenerating}
                className="ins-generate"
              >
                {isGenerating ? (
                  <Loader2 size={16} className="ins-spin" aria-hidden="true" />
                ) : (
                  <Sparkles size={16} aria-hidden="true" />
                )}
                {hasInsight ? "Tersedia" : "Tampilkan Insight"}
              </button>

              <InfoTooltip />
            </div>
          )}

          {userName && (
            <div ref={profileRef} className="ins-profile hidden lg:block">
              <button
                type="button"
                onClick={() => setProfileOpen((p) => !p)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                className="ins-profile-btn"
              >
                <span className="ins-avatar">
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={userName}
                      width={34}
                      height={34}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    userInitials
                  )}
                </span>
                <span>{userName}</span>
                <ChevronDown
                  size={15}
                  aria-hidden="true"
                  style={{
                    transform: profileOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {profileOpen && (
                <div className="ins-menu" role="menu">
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User size={16} aria-hidden="true" /> Lihat Profil
                  </Link>
                  <hr />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileOpen(false);
                      void handleLogout();
                    }}
                    disabled={isLoggingOut}
                  >
                    <LogOut size={16} aria-hidden="true" /> Keluar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <header className="ins-hero">
        <span className="ins-premium">
          <Sparkles size={13} aria-hidden="true" /> Premium aktif
        </span>
        <div className="ins-hero-copy">
          <span className="ins-kicker block">Ruang refleksi</span>
          <h1>
            <span className="sr-only">Insight Harian: </span>
            Pahami pola, <em>pelan-pelan.</em>
          </h1>
          <p>
            Ringkasan mood, pola, dan saran harianmu untuk membantu melihat hari
            dengan lebih jernih.
          </p>
        </div>

        <div className="ins-hero-side">
          <div
            className="ins-date"
            role="group"
            aria-label="Navigasi tanggal insight"
          >
            <IconButton
              onClick={onPrevDate}
              disabled={currentIndex <= 0}
              ariaLabel="Hari sebelumnya"
            >
              <ChevronLeft size={18} aria-hidden="true" />
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
              aria-label="Pilih tanggal insight"
            />

            <IconButton
              onClick={onNextDate}
              disabled={currentIndex >= availableDates.length - 1}
              ariaLabel="Hari berikutnya"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Dialog konfirmasi */}
      {showConfirm && (
        <div
          className="ins-overlay"
          onClick={() => setShowConfirm(false)}
          role="presentation"
        >
          <div
            className="ins-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ins-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ins-dialog-head">
              <span className="ins-dialog-icon">
                <Sparkles size={19} aria-hidden="true" />
              </span>
              <h3 id="ins-confirm-title">Tampilkan Insight?</h3>
            </div>

            <p>
              Insight hanya bisa ditampilkan <strong>1 kali per hari</strong>.
              Pastikan kamu sudah selesai bercerita di TemanCerita agar hasilnya
              lebih akurat.
            </p>

            <div className="ins-dialog-actions">
              <button type="button" onClick={handleConfirmGenerate}>
                Ya, Tampilkan
              </button>
              <Link href="/diary">Masih Mau Cerita</Link>
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
    <div ref={ref} className="ins-info">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="ins-info-btn"
        aria-label="Info"
        aria-expanded={open}
      >
        <span>
          <Info size={16} aria-hidden="true" />
        </span>
      </button>
      {open && (
        <div className="ins-pop" role="note">
          <strong>Tentang Insight</strong>
          <ul>
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
