"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  LogOut,
  ShieldCheck,
  User,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import SnapPayButton from "@/components/payment/SnapPayButton";
import {
  PRICE_PER_MONTH,
  SUBSCRIPTION_DURATIONS,
  getDurationPricing,
} from "@/lib/subscription/plans";
import "./subscription-redesign.css";

const DURATION_OPTIONS = SUBSCRIPTION_DURATIONS;

const basicFeatures = ["Mood check-in", "Diary harian", "Riwayat dasar"];

const premiumFeatures = [
  "Insight lengkap",
  "Tren mood",
  "Rekomendasi personal",
  "Akses premium",
];

const DAY_MS = 24 * 60 * 60 * 1000;

type SubscriptionInfo = {
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
} | null;

type PendingPaymentInfo = {
  id: string;
  orderId: string;
  token: string;
  durationMonths: number;
  grossAmount: string;
  status: string;
  createdAt: string;
} | null;

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRupiah(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export default function SubscriptionClient({
  isPremium,
  subscription,
  pendingPayment,
  midtransClientKey,
  midtransIsProduction,
}: {
  isPremium: boolean;
  subscription: SubscriptionInfo;
  pendingPayment: PendingPaymentInfo;
  midtransClientKey: string;
  midtransIsProduction: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Diisi setelah mount agar render server dan klien tidak berbeda.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.user?.name) setUserName(data.user.name);
        if (data?.user?.image) setUserImage(data.user.image);
      } catch {
        // ignore
      }
    };
    void fetchSession();
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

  useEffect(() => {
    if (status !== "success") return;

    const timeoutId = window.setTimeout(() => {
      router.replace("/subscription");
      router.refresh();
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [router, status]);

  const checkoutDuration = pendingPayment?.durationMonths ?? selectedDuration;
  // Harga dihitung dari aturan paket yang sama dengan tagihan di server.
  const selectedPricing = getDurationPricing(selectedDuration);
  const totalPrice = pendingPayment
    ? Number(pendingPayment.grossAmount)
    : selectedPricing.price;
  const totalNormalPrice = pendingPayment
    ? PRICE_PER_MONTH * pendingPayment.durationMonths
    : selectedPricing.normalPrice;
  const totalSavings = Math.max(0, totalNormalPrice - totalPrice);

  const handleCancelPending = useCallback(async () => {
    setCancelLoading(true);
    setCancelError(null);

    try {
      const res = await fetch("/api/payment/cancel", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setCancelError(data.error || "Gagal membatalkan pembayaran.");
        return;
      }

      router.refresh();
      router.push("/subscription");
    } catch {
      setCancelError("Terjadi kesalahan jaringan.");
    } finally {
      setCancelLoading(false);
    }
  }, [router]);

  // Progres masa aktif (hanya bila data langganan dan waktu klien tersedia).
  let progressPercent = 0;
  let daysLeft: number | null = null;
  if (isPremium && subscription && now !== null) {
    const start = new Date(subscription.startedAt).getTime();
    const end = new Date(subscription.expiresAt).getTime();
    const total = Math.max(end - start, 1);
    progressPercent = Math.min(100, Math.max(0, ((now - start) / total) * 100));
    daysLeft = Math.max(0, Math.ceil((end - now) / DAY_MS));
  }

  return (
    <main className="tt-sub">
      <div className="sub-scroll tt-dashboard-scroll-y">
        <div className="sub-page">
          {/* Profil — hanya desktop */}
          {userName && (
            <div className="sub-topbar hidden lg:flex">
              <SubscriptionProfileDropdown
                userName={userName}
                userImage={userImage}
                isLoggingOut={isLoggingOut}
                onLogout={() => void handleLogout()}
              />
            </div>
          )}

          {/* Pesan status */}
          {status === "success" && (
            <p className="sub-banner is-success" role="status">
              Pembayaran berhasil! Premium kamu sudah aktif.
            </p>
          )}

          {status === "pending" && (
            <p className="sub-banner is-warning" role="status">
              Pembayaran sedang diproses. Status akan diperbarui otomatis.
            </p>
          )}

          {pendingPayment && (
            <p className="sub-banner is-warning" role="status">
              Ada pembayaran {pendingPayment.durationMonths} bulan yang masih
              tertunda. Selesaikan atau batalkan pembayaran ini sebelum memilih
              durasi lain.
            </p>
          )}

          {/* Hero */}
          <section className="sub-hero">
            <div className="sub-hero-copy">
              <span className="sub-kicker">Langgananmu</span>
              <h1>
                <span className="sr-only">
                  {isPremium ? "Premium aktif. " : "Upgrade ke Premium! "}
                </span>
                {isPremium ? (
                  <>
                    Ruang tumbuhmu sedang <em>aktif.</em>
                  </>
                ) : (
                  <>
                    Buka ruang tumbuh yang <em>lebih lengkap.</em>
                  </>
                )}
              </h1>
              <p>
                {isPremium
                  ? "Semua fitur utama sudah terbuka."
                  : "Buka pengalaman yang lebih lengkap untuk refleksi harianmu."}
              </p>
              {isPremium && subscription && (
                <p style={{ marginTop: 6 }}>
                  Aktif hingga:{" "}
                  <strong>{formatLongDate(subscription.expiresAt)}</strong>
                </p>
              )}
            </div>

            <div className="sub-stamp">
              <ShieldCheck size={22} aria-hidden="true" />
              <span>
                <strong>{isPremium ? "Premium" : "Basic"}</strong>
                {isPremium ? "Aktif sekarang" : "Paket saat ini"}
              </span>
            </div>

            <svg className="sub-doodle" viewBox="0 0 105 65" aria-hidden="true">
              <path d="M4 47c19-36 39 12 59-14 10-13 20-12 36-5M85 18l15 10-13 9" />
            </svg>
          </section>

          {/* Masa aktif */}
          {isPremium && subscription && daysLeft !== null && (
            <section className="sub-progress" aria-label="Masa aktif langganan">
              <div>
                <small>Mulai</small>
                <strong>{formatLongDate(subscription.startedAt)}</strong>
              </div>
              <div
                className="sub-track"
                role="progressbar"
                aria-label="Masa aktif terpakai"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progressPercent)}
              >
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div>
                <small>Berakhir</small>
                <strong>{formatLongDate(subscription.expiresAt)}</strong>
              </div>
              <p>
                <b>{daysLeft} hari tersisa</b>
              </p>
            </section>
          )}

          <div className="sub-layout">
            {/* Paket saat ini */}
            <article className="sub-current">
              <span className="sub-kicker">Paket saat ini</span>
              <h2>{isPremium ? "Premium" : "Basic"}</h2>
              <p className="sub-lead">
                {isPremium
                  ? "Dukungan lebih lengkap untuk menemani perjalanan refleksimu."
                  : "Cukup untuk mulai mencatat cerita dan mengenali perasaanmu."}
              </p>
              <ul className="sub-features">
                {(isPremium ? premiumFeatures : basicFeatures).map(
                  (feature) => (
                    <li key={feature}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ),
                )}
              </ul>
              {isPremium ? (
                <>
                  <Link href="/insight" className="sub-link">
                    Lihat insight-mu <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                  <span className="sub-sticker">semua sudah terbuka!</span>
                </>
              ) : null}
            </article>

            {/* Upgrade / perpanjang */}
            <article className="sub-renew">
              <span className="sub-kicker">
                {isPremium ? "Lanjutkan perjalanan" : "Naik level"}
              </span>
              <h2>{isPremium ? "Perpanjang Premium" : "Upgrade ke Premium"}</h2>
              <p className="sub-lead">
                Pilih durasi yang paling nyaman. Pembayaran diproses lewat
                Midtrans.
              </p>

              {!isPremium ? (
                <ul className="sub-features">
                  {premiumFeatures.map((feature) => (
                    <li key={feature}>
                      <span aria-hidden="true">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              ) : null}

              <p className="sub-duration-label" id="sub-duration-label">
                {isPremium ? "Perpanjang Durasi" : "Pilih Durasi"}
              </p>
              <div
                className="sub-durations"
                role="group"
                aria-labelledby="sub-duration-label"
              >
                {DURATION_OPTIONS.map((opt) => {
                  const pricing = getDurationPricing(opt.months);

                  return (
                    <button
                      key={opt.months}
                      type="button"
                      aria-pressed={checkoutDuration === opt.months}
                      onClick={() => {
                        if (!pendingPayment) {
                          setSelectedDuration(opt.months);
                        }
                      }}
                      disabled={pendingPayment !== null}
                      className="sub-duration"
                    >
                      <span>{opt.label}</span>
                      <div className="sub-prices">
                        {pricing.savings > 0 && (
                          <del>{formatRupiah(pricing.normalPrice)}</del>
                        )}
                        <strong>{formatRupiah(pricing.price)}</strong>
                      </div>
                      {pricing.savings > 0 && (
                        <em className="sub-save">
                          Hemat {formatRupiah(pricing.savings)}
                        </em>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="sub-total">
                <span>Total</span>
                {totalSavings > 0 && (
                  <del>{formatRupiah(totalNormalPrice)}</del>
                )}
                <strong>{formatRupiah(totalPrice)}</strong>
                <small>
                  {totalSavings > 0
                    ? `Hemat ${formatRupiah(totalSavings)}`
                    : `untuk ${checkoutDuration} bulan`}
                </small>
              </div>

              <div className="sub-actions">
                {pendingPayment ? (
                  <>
                    <SnapPayButton
                      durationMonths={pendingPayment.durationMonths}
                      pendingToken={pendingPayment.token}
                      clientKey={midtransClientKey}
                      isProduction={midtransIsProduction}
                      label="Lanjutkan Pembayaran Tertunda"
                      className="sub-pay is-warning"
                    />

                    <button
                      type="button"
                      onClick={handleCancelPending}
                      disabled={cancelLoading}
                      className="sub-cancel"
                    >
                      {cancelLoading ? "Membatalkan..." : "Batalkan Pembayaran"}
                    </button>

                    {cancelError && (
                      <p className="sub-error" role="alert">
                        {cancelError}
                      </p>
                    )}
                  </>
                ) : (
                  <SnapPayButton
                    durationMonths={selectedDuration}
                    clientKey={midtransClientKey}
                    isProduction={midtransIsProduction}
                    label={
                      isPremium
                        ? `Perpanjang ${selectedDuration} Bulan`
                        : `Upgrade Premium ${selectedDuration} Bulan`
                    }
                    className="sub-pay"
                  />
                )}
              </div>
            </article>
          </div>

          <section className="sub-note">
            <span className="sub-note-icon" aria-hidden="true">
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>Tetap dalam kendalimu.</strong>
              <p>
                Pembayaran diproses lewat Midtrans, dan pembayaran yang belum
                selesai bisa kamu batalkan dari halaman ini.
              </p>
            </div>
            <Link href="/pricing" className="sub-link">
              Lihat perbandingan paket
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

// ─── Profile Dropdown for Subscription Page ───────────────────────────────────

function SubscriptionProfileDropdown({
  userName,
  userImage,
  isLoggingOut,
  onLogout,
}: {
  userName: string;
  userImage: string | null;
  isLoggingOut: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userInitials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="sub-profile">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="sub-profile-btn"
      >
        <span className="sub-avatar">
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
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {open && (
        <div className="sub-menu" role="menu">
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)}>
            <User size={16} aria-hidden="true" />
            Lihat Profil
          </Link>

          <hr />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            disabled={isLoggingOut}
          >
            <LogOut size={16} aria-hidden="true" />
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
