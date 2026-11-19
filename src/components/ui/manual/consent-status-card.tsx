"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
export type ConsentVariant =
  | "loading"
  | "accepted"
  | "rejected"
  | "invalid"
  | "missing-decision"
  | "expired"
  | "processed"
  | "system-error";

type ConsentStatusCardProps = {
  variant: ConsentVariant;
  result: {
    title: string;
    description: string;
    email?: string;
    decision?: string;
  } | null;
  shouldReduce?: boolean;
};

function getVariantConfig(variant: ConsentVariant, decision?: string) {
  switch (variant) {
    case "accepted":
      return {
        icon: (
          <CheckCircle2
            className="h-14 w-14"
            style={{ color: "var(--color-brand-teal)" }}
          />
        ),
        panelBg: "var(--color-brand-teal-ghost)",
        panelBorder: "var(--color-brand-teal-pale)",
        panelTitle: "Apa yang terjadi selanjutnya?",
        panelText:
          "Jika email ini baru ditautkan, laporan mingguan TemanTumbuh akan mulai dikirim sesuai jadwal berikutnya.",
      };

    case "rejected":
      return {
        icon: <XCircle className="h-14 w-14" style={{ color: "#D16A3D" }} />,
        panelBg: "#FFF6F1",
        panelBorder: "#F7C9B1",
        panelTitle: "Status saat ini",
        panelText:
          "Tidak ada laporan mingguan yang akan dikirim ke email ini kecuali pengguna mengajukan persetujuan baru.",
      };

    case "missing-decision":
      return {
        icon: (
          <AlertCircle className="h-14 w-14" style={{ color: "#B98600" }} />
        ),
        panelBg: "#FFF9E9",
        panelBorder: "#F4D56A",
        panelTitle: "Apa yang perlu dilakukan?",
        panelText:
          "Buka kembali email persetujuan dan klik tombol Setuju atau Tolak agar sistem dapat memproses keputusan.",
      };

    case "processed":
      return {
        icon: (
          <AlertCircle className="h-14 w-14" style={{ color: "#B98600" }} />
        ),
        panelBg: "#FFF9E9",
        panelBorder: "#F4D56A",
        panelTitle: "Informasi",
        panelText:
          "Tautan ini biasanya hanya bisa digunakan satu kali. Gunakan permintaan persetujuan yang baru jika ingin mengubah status.",
      };

    case "expired":
      return {
        icon: (
          <AlertCircle className="h-14 w-14" style={{ color: "#B98600" }} />
        ),
        panelBg: "#FFF9E9",
        panelBorder: "#F4D56A",
        panelTitle: "Bantuan",
        panelText:
          "Minta pengguna mengirim ulang permintaan persetujuan dari aplikasi agar email menerima tautan baru yang masih aktif.",
      };

    case "system-error":
      return {
        icon: <XCircle className="h-14 w-14" style={{ color: "#D16A3D" }} />,
        panelBg: "#FFF6F1",
        panelBorder: "#F7C9B1",
        panelTitle: "Bantuan",
        panelText:
          "Coba lagi beberapa saat. Jika masalah tetap berlanjut, periksa server API dan database token persetujuan.",
      };

    case "invalid":
    default:
      return {
        icon:
          decision === "reject" ? (
            <XCircle className="h-14 w-14" style={{ color: "#D16A3D" }} />
          ) : (
            <AlertCircle className="h-14 w-14" style={{ color: "#B98600" }} />
          ),
        panelBg: "#FFF9E9",
        panelBorder: "#F4D56A",
        panelTitle: "Bantuan",
        panelText:
          "Pastikan tautan dibuka utuh dari email terbaru. Jangan ubah parameter token atau decision di URL.",
      };
  }
}

export function ConsentStatusCard({
  variant,
  result,
  shouldReduce = false,
}: ConsentStatusCardProps) {
  const config = getVariantConfig(variant, result?.decision);

  return (
    <motion.div
      initial={shouldReduce ? {} : { opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        maxWidth: 520,
        background: "#ffffff",
        border: "1.5px solid var(--color-brand-border)",
        boxShadow:
          "0 20px 60px rgba(26,40,64,0.11), 0 4px 16px rgba(26,40,64,0.07)",
      }}
    >
      <div style={{ height: 4, background: "var(--gradient-brand-bar)" }} />

      <div className="px-7 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
        {variant === "loading" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-5">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: "var(--color-brand-teal)" }}
              />
            </div>
            <h1
              className="mb-2 text-xl font-bold"
              style={{ color: "var(--color-text-brand-primary)" }}
            >
              Memproses Persetujuan
            </h1>
            <p
              className="max-w-sm text-sm leading-relaxed"
              style={{ color: "var(--color-text-brand-muted)" }}
            >
              Mohon tunggu sebentar, kami sedang memverifikasi tautan dan
              memperbarui status persetujuan.
            </p>
          </div>
        )}

        {variant !== "loading" && result && (
          <motion.div
            initial={shouldReduce ? {} : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-5">{config.icon}</div>

            <h1
              className="mb-2 text-2xl font-bold"
              style={{ color: "var(--color-text-brand-primary)" }}
            >
              {result.title}
            </h1>

            <p
              className="mb-6 max-w-md text-sm leading-relaxed sm:text-[15px]"
              style={{ color: "var(--color-text-brand-secondary)" }}
            >
              {result.description}
            </p>

            <div
              className="mb-6 w-full rounded-xl border p-4 text-left"
              style={{
                background: config.panelBg,
                borderColor: config.panelBorder,
              }}
            >
              <p
                className="mb-1 text-sm font-semibold"
                style={{ color: "var(--color-text-brand-primary)" }}
              >
                {config.panelTitle}
              </p>
              <p
                className="text-[13px] leading-relaxed"
                style={{ color: "var(--color-text-brand-secondary)" }}
              >
                {config.panelText}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: "var(--gradient-brand-btn)",
                  boxShadow: "0 4px 18px rgba(26,150,136,0.28)",
                }}
              >
                Ke Beranda <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
