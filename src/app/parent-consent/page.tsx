"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useReducedMotion } from "framer-motion";

import {
  ConsentStatusCard,
  type ConsentVariant,
} from "@/components/ui/manual/consent-status-card";

type ConsentApiResult = {
  success?: boolean;
  title?: string;
  description?: string;
  message?: string;
  email?: string;
  decision?: "accept" | "reject" | string;
  code?: string;
};

function normalizeApiPayload(
  data: ConsentApiResult,
  fallbackDecision: string,
  httpStatus: number,
): {
  variant: ConsentVariant;
  title: string;
  description: string;
  email?: string;
  decision?: string;
} {
  const title = (data.title || "").toLowerCase();
  const description = (data.description || data.message || "").toLowerCase();
  const decision = data.decision || fallbackDecision;

  if (httpStatus >= 500) {
    return {
      variant: "system-error",
      title: data.title || "Terjadi Kesalahan Sistem",
      description:
        data.description ||
        data.message ||
        "Server sedang mengalami gangguan. Silakan coba lagi beberapa saat.",
      email: data.email,
      decision,
    };
  }

  if (data.success) {
    if (decision === "reject") {
      return {
        variant: "rejected",
        title: data.title || "Permintaan Ditolak",
        description:
          data.description ||
          "Permintaan persetujuan telah ditolak. Email tidak dihubungkan ke akun anak.",
        email: data.email,
        decision,
      };
    }

    return {
      variant: "accepted",
      title: data.title || "Persetujuan Berhasil",
      description:
        data.description ||
        "Persetujuan telah dicatat. Laporan TemanTumbuh akan dikirim sesuai jadwal.",
      email: data.email,
      decision,
    };
  }

  if (title.includes("keputusan belum dipilih")) {
    return {
      variant: "missing-decision",
      title: data.title || "Keputusan Belum Dipilih",
      description:
        data.description ||
        "Gunakan tombol Setuju atau Tolak dari email untuk memberikan persetujuan.",
      email: data.email,
      decision,
    };
  }

  if (
    title.includes("tidak lagi aktif") ||
    description.includes("diproses sebelumnya")
  ) {
    return {
      variant: "processed",
      title: data.title || "Tautan Sudah Diproses",
      description:
        data.description ||
        "Permintaan ini sudah diproses sebelumnya dan tautannya tidak aktif lagi.",
      email: data.email,
      decision,
    };
  }

  if (
    title.includes("kedaluwarsa") ||
    description.includes("kedaluwarsa") ||
    description.includes("sudah pernah digunakan")
  ) {
    return {
      variant: "expired",
      title: data.title || "Tautan Kedaluwarsa",
      description:
        data.description ||
        "Tautan persetujuan sudah tidak valid, sudah pernah digunakan, atau telah kedaluwarsa.",
      email: data.email,
      decision,
    };
  }

  if (title.includes("tidak valid") || description.includes("tidak valid")) {
    return {
      variant: "invalid",
      title: data.title || "Tautan Tidak Valid",
      description:
        data.description ||
        "Token atau parameter persetujuan tidak valid. Silakan gunakan tautan terbaru dari email.",
      email: data.email,
      decision,
    };
  }

  if (decision === "reject") {
    return {
      variant: "rejected",
      title: data.title || "Permintaan Ditolak",
      description:
        data.description ||
        "Permintaan persetujuan telah ditolak. Email tidak dihubungkan ke akun anak.",
      email: data.email,
      decision,
    };
  }

  return {
    variant: httpStatus >= 500 ? "system-error" : "invalid",
    title: data.title || "Tautan Tidak Dapat Diproses",
    description:
      data.description ||
      data.message ||
      "Tautan persetujuan tidak dapat diproses. Silakan gunakan tautan terbaru dari email.",
    email: data.email,
    decision,
  };
}

function ParentConsentPageContent() {
  const searchParams = useSearchParams();
  const shouldReduce = useReducedMotion();

  const token = searchParams.get("token") ?? "";
  const decision = searchParams.get("decision") ?? "";

  const [variant, setVariant] = useState<ConsentVariant>("loading");
  const [result, setResult] = useState<{
    title: string;
    description: string;
    email?: string;
    decision?: string;
  } | null>(null);

  const normalizedDecision = useMemo(() => {
    if (decision === "accept" || decision === "reject") return decision;
    return "";
  }, [decision]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setVariant("invalid");
        setResult({
          title: "Tautan Tidak Valid",
          description:
            "Token persetujuan tidak ditemukan. Silakan gunakan tautan terbaru dari email.",
        });
        return;
      }

      if (!normalizedDecision) {
        setVariant("missing-decision");
        setResult({
          title: "Keputusan Belum Dipilih",
          description:
            "Gunakan tombol Setuju atau Tolak dari email untuk memberikan persetujuan.",
        });
        return;
      }

      try {
        setVariant("loading");

        const response = await fetch(
          `/api/parent-consent?token=${encodeURIComponent(token)}&decision=${encodeURIComponent(normalizedDecision)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const contentType = response.headers.get("content-type") || "";
        let data: ConsentApiResult = {};

        if (contentType.includes("application/json")) {
          data = (await response.json()) as ConsentApiResult;
        } else {
          const text = await response.text();
          data = {
            success: response.ok,
            title: response.ok
              ? normalizedDecision === "accept"
                ? "Persetujuan Berhasil"
                : "Permintaan Ditolak"
              : "Tautan Tidak Dapat Diproses",
            description: text,
            decision: normalizedDecision,
          };
        }

        if (cancelled) return;

        const normalized = normalizeApiPayload(
          data,
          normalizedDecision,
          response.status,
        );

        setVariant(normalized.variant);
        setResult({
          title: normalized.title,
          description: normalized.description,
          email: normalized.email,
          decision: normalized.decision,
        });
      } catch {
        if (cancelled) return;

        setVariant("system-error");
        setResult({
          title: "Gagal Memproses Persetujuan",
          description:
            "Terjadi gangguan saat menghubungi server. Silakan coba lagi beberapa saat.",
          decision: normalizedDecision,
        });
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [token, normalizedDecision]);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{ background: "var(--color-page-bg1, #F8FBFD)" }}
    >
      <ConsentStatusCard
        variant={variant}
        result={result}
        shouldReduce={!!shouldReduce}
      />
    </div>
  );
}

function ParentConsentLoadingFallback() {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6"
      style={{ background: "var(--color-page-bg1, #F8FBFD)" }}
    >
      <ConsentStatusCard variant="loading" result={null} shouldReduce />
    </div>
  );
}

export default function ParentConsentPage() {
  return (
    <Suspense fallback={<ParentConsentLoadingFallback />}>
      <ParentConsentPageContent />
    </Suspense>
  );
}
