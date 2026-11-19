"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onError?: (result: Record<string, unknown>) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

// URL is determined dynamically based on isProduction prop

export default function SnapPayButton({
  durationMonths,
  pendingToken,
  clientKey,
  isProduction,
  label,
  className,
  style,
}: {
  durationMonths: number;
  pendingToken?: string;
  clientKey: string;
  isProduction: boolean;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const snapLoaded = useRef(false);

  useEffect(() => {
    if (snapLoaded.current) return;

    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    // Check if Snap script is already loaded
    if (document.querySelector(`script[src="${snapUrl}"]`)) {
      snapLoaded.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = snapUrl;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => {
      snapLoaded.current = true;
    };
    document.head.appendChild(script);
  }, [clientKey, isProduction]);

  const handlePay = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let tokenToUse = pendingToken;

      // If we don't have a pending token, create a new transaction
      if (!tokenToUse) {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ durationMonths }),
        });

        const data = await res.json();

        if (!res.ok || !data.token) {
          setError(data.error || "Gagal membuat transaksi.");
          setLoading(false);
          return;
        }

        tokenToUse = data.token;
      }

      // Open Midtrans Snap pop-up
      if (!window.snap) {
        setError("Snap belum dimuat. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      document.body.classList.add("snap-open");

      window.snap.pay(tokenToUse as string, {
        onSuccess: () => {
          document.body.classList.remove("snap-open");
          setLoading(false);
          router.refresh();
          router.push("/subscription?status=success");
        },
        onPending: () => {
          document.body.classList.remove("snap-open");
          setLoading(false);
          router.refresh();
          router.push("/subscription?status=pending");
        },
        onError: () => {
          document.body.classList.remove("snap-open");
          setError("Pembayaran gagal. Silakan coba lagi.");
          setLoading(false);
        },
        onClose: () => {
          document.body.classList.remove("snap-open");
          setLoading(false);
        },
      });
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }, [durationMonths, pendingToken, router]);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className={className}
        style={style}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Memproses...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            {label || `Upgrade Premium ${durationMonths} Bulan`}
          </span>
        )}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs font-medium text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
