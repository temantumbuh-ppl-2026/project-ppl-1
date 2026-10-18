"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type PlanStatus =
  | { kind: "unknown" }
  | { kind: "guest" }
  | { kind: "free" }
  | { kind: "premium"; expiresAt: string | null }
  | { kind: "pending"; durationMonths: number };

type StatusResponse = {
  isPremium?: boolean;
  subscription?: { expiresAt?: string } | null;
  pendingPayment?: { durationMonths?: number } | null;
};

// Status pengguna diambil dari endpoint yang sama dengan halaman /subscription.
// Sebelum status diketahui, tombol memakai tujuan yang aman untuk semua kondisi.
function useSubscriptionStatus(): PlanStatus {
  const [status, setStatus] = useState<PlanStatus>({ kind: "unknown" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch("/api/subscription/status", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          setStatus({ kind: "guest" });
          return;
        }
        if (!response.ok) return;

        const data = (await response.json()) as StatusResponse;
        if (data.pendingPayment) {
          setStatus({
            kind: "pending",
            durationMonths: data.pendingPayment.durationMonths ?? 0,
          });
        } else if (data.isPremium) {
          setStatus({
            kind: "premium",
            expiresAt: data.subscription?.expiresAt ?? null,
          });
        } else {
          setStatus({ kind: "free" });
        }
      } catch {
        // Gagal memuat status: tetap pakai tombol bawaan.
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  return status;
}

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function PlanActions({ plan }: { plan: "basic" | "single" }) {
  const status = useSubscriptionStatus();

  if (plan === "basic") {
    if (
      status.kind === "free" ||
      status.kind === "premium" ||
      status.kind === "pending"
    ) {
      return (
        <div className="plan-action">
          <div className="plan-slot" aria-hidden="true" />
          <span
            aria-disabled="true"
            className="button pricing-button pricing-button-outline"
            role="link"
          >
            {status.kind === "free" ? "Paket kamu saat ini" : "Paket dasar"}
          </span>
          <div className="plan-slot plan-slot-note" aria-hidden="true" />
        </div>
      );
    }
    return (
      <div className="plan-action">
        <div className="plan-slot" aria-hidden="true" />
        <Link
          className="button pricing-button pricing-button-outline"
          href="/register"
        >
          Gunakan Gratis <ArrowRight className="icon" size={18} />
        </Link>
        <div className="plan-slot plan-slot-note" aria-hidden="true" />
      </div>
    );
  }

  const expiry =
    status.kind === "premium" ? formatDate(status.expiresAt) : null;

  let href = "/subscription";
  let label = "Pilih Paket Single";
  let note: React.ReactNode = null;

  if (status.kind === "guest") {
    href = "/register";
    note = (
      <small>
        Pembayaran dilakukan setelah kamu masuk, di halaman langganan. Sudah
        punya akun? <Link href="/login">Masuk</Link>
      </small>
    );
  } else if (status.kind === "free") {
    label = "Upgrade ke Single";
  } else if (status.kind === "premium") {
    label = "Perpanjang Langganan";
  } else if (status.kind === "pending") {
    label = "Lanjutkan Pembayaran";
  }

  return (
    <div className="plan-action" id="integrasi-pembayaran">
      <div className="plan-slot">
        {status.kind === "premium" && (
          <span className="plan-status" aria-live="polite">
            Paket Single aktif{expiry ? ` hingga ${expiry}` : ""}
          </span>
        )}
        {status.kind === "pending" && (
          <span className="plan-status is-pending" aria-live="polite">
            Ada pembayaran {status.durationMonths} bulan yang belum selesai
          </span>
        )}
      </div>
      <Link className="button pricing-button" href={href}>
        {label} <ArrowRight className="icon" size={18} />
      </Link>
      <div className="plan-slot plan-slot-note">{note}</div>
    </div>
  );
}
