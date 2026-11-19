"use client";

import { useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { PRIORITY_STYLE } from "../lib/insight-data";
import type { ActionPriority } from "../lib/insight-types";
import { cn } from "../lib/insight-utils";

export function SurfaceCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-[28px] border bg-white", className)}
      style={{
        borderColor: "rgba(25,39,44,0.06)",
        boxShadow:
          "0 1px 2px rgba(16,24,40,0.03), 0 12px 32px rgba(16,24,40,0.06)",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      {children}
    </section>
  );
}

export function TopCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SurfaceCard className={cn("flex flex-col overflow-hidden", className)}>
      {children}
    </SurfaceCard>
  );
}

export function TopCardHeader({
  title,
  subtitle,
  right,
  accent,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="flex min-h-[112px] items-center justify-between gap-4 border-b px-6 py-5"
      style={{
        borderColor: "rgba(25,39,44,0.06)",
        background: accent
          ? "linear-gradient(135deg, rgba(26,150,136,0.04) 0%, rgba(78,207,195,0.02) 100%)"
          : "transparent",
      }}
    >
      <div className="min-w-0">
        <p
          className="text-[17px] font-bold leading-6 tracking-[-0.01em]"
          style={{
            color: "var(--tt-dashboard-brand-deep)",
            fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
          }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-sm leading-6"
          style={{
            color: "var(--tt-dashboard-text-2)",
            fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
          }}
        >
          {subtitle}
        </p>
      </div>
      {right}
    </div>
  );
}

export function InsightActionButton({
  isToday,
  hasInsight,
  isGenerating,
  onClick,
}: {
  isToday: boolean;
  hasInsight: boolean;
  isGenerating: boolean;
  onClick: () => void;
}) {
  if (!isToday) return null;

  const disabled = hasInsight || isGenerating;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-70"
          : "cursor-pointer hover:translate-y-[-1px]",
      )}
      style={{
        background:
          hasInsight || isGenerating ? "#E8F2F0" : "var(--gradient-brand-btn)",
        color:
          hasInsight || isGenerating ? "var(--tt-dashboard-text-2)" : "#FFFFFF",
        boxShadow:
          hasInsight || isGenerating
            ? "none"
            : "0 10px 22px rgba(26,150,136,0.22)",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      {isGenerating ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Membuat AI Insight...
        </>
      ) : hasInsight ? (
        "Insight Tersedia"
      ) : (
        <>Generate Insight</>
      )}
    </button>
  );
}

export function PillButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-all duration-200"
      style={{
        background: active ? "var(--tt-dashboard-active-bg)" : "#FFFFFF",
        color: active
          ? "var(--tt-dashboard-active-text)"
          : "var(--tt-dashboard-text-2)",
        borderColor: active ? "transparent" : "rgba(25,39,44,0.08)",
        boxShadow: active ? "0 8px 18px rgba(26,150,136,0.18)" : "none",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children,
  onClick,
  disabled,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-200",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer hover:bg-[#F8FCFB]",
      )}
      style={{
        background: "#FFFFFF",
        borderColor: "rgba(25,39,44,0.08)",
        color: "var(--tt-dashboard-text)",
      }}
    >
      {children}
    </button>
  );
}

export function DateButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer inline-flex h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-all duration-200 hover:bg-[#F8FCFB]"
      style={{
        background: "#FFFFFF",
        color: "var(--tt-dashboard-text-2)",
        borderColor: "rgba(25,39,44,0.08)",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      <CalendarDays size={14} />
      <span>{label}</span>
    </button>
  );
}

/**
 * InfoHint — pakai z-index sangat tinggi agar tooltip selalu di atas
 * card/elemen lain. Container-nya juga di-z-elevate saat hover.
 */
export function InfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn("group relative shrink-0", open ? "z-[9999]" : "z-10")}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{ position: "relative" }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Lihat penjelasan"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full"
      >
        <Info
          size={15}
          className="cursor-help"
          style={{ color: "var(--tt-dashboard-text-3)" }}
        />
      </button>

      <div
        className={cn(
          "absolute bottom-[calc(100%+10px)] left-1/2 w-56 -translate-x-1/2 rounded-2xl border bg-white px-3 py-2 transition-all duration-200",
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-[6px] opacity-0",
        )}
        style={{
          borderColor: "rgba(25,39,44,0.08)",
          color: "var(--tt-dashboard-text-2)",
          boxShadow: "0 10px 24px rgba(16,24,40,0.18)",
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
          zIndex: 9999,
        }}
      >
        <p className="text-xs leading-5">{text}</p>
      </div>
    </div>
  );
}

/**
 * StatBox — TANPA accent bar di kiri (sesuai request).
 * Padding lega, layout kiri-rata.
 */
export function StatBox({
  value,
  caption,
  label,
  helper,
  valueColor,
}: {
  value: string;
  caption?: string;
  label: string;
  helper?: string;
  valueColor?: string;
}) {
  return (
    <div className="...">
      <div className="flex items-baseline gap-2">
        <span style={{ color: valueColor }} className="text-2xl font-bold">
          {value}
        </span>
        {caption && (
          <span
            className="text-xs font-semibold"
            style={{ color: valueColor, opacity: 0.85 }}
          >
            {caption}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {helper && <p className="mt-1 text-xs opacity-70">{helper}</p>}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const config = PRIORITY_STYLE[priority];

  return (
    <span
      className="inline-flex h-7 items-center rounded-full border px-3 text-xs font-semibold"
      style={{
        background: config.bg,
        color: config.text,
        borderColor: config.ring,
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      {config.label}
    </span>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-2xl border bg-white px-3 py-2"
      style={{
        borderColor: "rgba(25,39,44,0.08)",
        boxShadow: "0 12px 28px rgba(16,24,40,0.12)",
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      <p
        className="text-xs font-semibold leading-5"
        style={{ color: "var(--tt-dashboard-text)" }}
      >
        {`Tanggal ${label}`}
      </p>
      <p
        className="mt-0.5 text-sm font-medium leading-5"
        style={{ color: "var(--tt-dashboard-brand-deep)" }}
      >
        Mood {payload[0]?.value}/5
      </p>
    </div>
  );
}

/**
 * NotebookReflection — halaman buku catatan: kertas krem, garis biru,
 * margin merah di kiri.
 */
export function NotebookReflection({ text }: { text: string }) {
  const lineGap = 36;
  const topOffset = 22;

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border"
      style={{
        borderColor: "rgba(25,39,44,0.08)",
        background: "#FDFCF7",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(16,24,40,0.04)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(180,160,90,0.08) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(180,160,90,0.06) 0%, transparent 40%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0 ${lineGap - 1}px,
            rgba(76,113,156,0.18) ${lineGap - 1}px ${lineGap}px
          )`,
          backgroundPosition: `0 ${topOffset}px`,
        }}
      />

      <div
        className="pointer-events-none absolute left-[64px] top-0 h-full w-px"
        style={{ background: "rgba(220,80,80,0.35)" }}
      />

      <div className="relative px-20 pb-8 pt-7">
        <p
          className="font-normal"
          style={{
            color: "#2C3E50",
            lineHeight: `${lineGap}px`,
            fontSize: "15.5px",
            margin: 0,
            fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
            letterSpacing: "0.005em",
          }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/**
 * QuoteBlock — TANPA card. Hanya tanda kutip besar + teks italic
 * yang "bernapas" di ruang terbuka, tidak terpotong.
 */
export function QuoteBlock({ text }: { text: string }) {
  return (
    <div
      className="relative px-2 py-4"
      style={{
        fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
      }}
    >
      {/* Tanda kutip pembuka — besar, terlihat penuh */}
      <span
        aria-hidden
        className="block select-none leading-none"
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "84px",
          color: "rgba(26,150,136,0.32)",
          height: "44px",
          fontWeight: 700,
        }}
      >
        “
      </span>

      <p
        className="mt-2 text-[17px] italic leading-[1.75]"
        style={{
          color: "var(--tt-dashboard-brand-deep)",
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
          fontWeight: 500,
          paddingLeft: "4px",
        }}
      >
        {text}
      </p>

      {/* Tanda kutip penutup — sejajar kanan */}
      <div className="mt-1 flex justify-end">
        <span
          aria-hidden
          className="block select-none leading-none"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "60px",
            color: "rgba(26,150,136,0.28)",
            height: "32px",
            fontWeight: 700,
          }}
        >
          ”
        </span>
      </div>

      {/* Garis aksen tipis di bawah */}
      <div className="mt-2 flex">
        <span
          className="h-[2px] w-10 rounded-full"
          style={{ background: "var(--gradient-brand-bar)" }}
        />
      </div>
    </div>
  );
}

export function InsightPlaceholderCard({ title }: { title: string }) {
  return (
    <div
      className="rounded-[28px] border px-5 py-5"
      style={{
        background: "#FFFFFF",
        borderColor: "rgba(25,39,44,0.06)",
      }}
    >
      <p
        className="text-xs font-bold uppercase tracking-[0.12em]"
        style={{
          color: "var(--tt-dashboard-text-2)",
          fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
        }}
      >
        {title}
      </p>

      <div className="mt-3 space-y-2.5">
        <div className="h-3.5 w-[85%] rounded-full bg-[rgba(25,39,44,0.06)]" />
        <div className="h-3.5 w-[72%] rounded-full bg-[rgba(25,39,44,0.06)]" />
      </div>
    </div>
  );
}

export function EmptyReflectionState({ isToday }: { isToday: boolean }) {
  return (
    <div
      className="rounded-[28px] border px-6 py-7"
      style={{
        background: "#FCFEFD",
        borderColor: "rgba(25,39,44,0.06)",
      }}
    >
      <div className="space-y-3">
        <div className="h-4 w-[76%] rounded-full bg-[rgba(25,39,44,0.06)]" />
        <div className="h-4 w-[62%] rounded-full bg-[rgba(25,39,44,0.06)]" />
        <div className="h-4 w-[67%] rounded-full bg-[rgba(25,39,44,0.06)]" />
      </div>

      <div className="mt-5">
        <p
          className="text-sm leading-6"
          style={{
            color: "var(--tt-dashboard-text-2)",
            fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
          }}
        >
          {isToday
            ? "Insight hari ini belum tersedia. Tekan tombol di atas untuk melihat ringkasannya."
            : "Belum ada insight untuk tanggal ini."}
        </p>
      </div>
    </div>
  );
}

export function TrendPlaceholder() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-6 py-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="rounded-[28px] border px-6 py-7"
            style={{
              background: "#FFFFFF",
              borderColor: "rgba(25,39,44,0.06)",
            }}
          >
            <div className="flex min-h-[120px] flex-col items-start justify-center">
              <div className="h-3 w-24 rounded-full bg-[rgba(25,39,44,0.06)]" />
              <div className="mt-4 h-8 w-20 rounded-full bg-[rgba(25,39,44,0.06)]" />
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex flex-1 flex-col rounded-[28px] border p-5"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #F9FCFB 100%)",
          borderColor: "rgba(25,39,44,0.06)",
        }}
      >
        <div className="min-h-[320px] rounded-[24px] border border-[rgba(25,39,44,0.06)] bg-[rgba(25,39,44,0.02)] p-4">
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-8">
              <div className="h-px w-full bg-[rgba(25,39,44,0.06)]" />
              <div className="h-px w-full bg-[rgba(25,39,44,0.06)]" />
              <div className="h-px w-full bg-[rgba(25,39,44,0.06)]" />
              <div className="h-px w-full bg-[rgba(25,39,44,0.06)]" />
            </div>
            <div
              className="text-xs"
              style={{
                color: "var(--tt-dashboard-text-2)",
                fontFamily: "var(--font-plus-jakarta), system-ui, sans-serif",
              }}
            >
              Belum ada data mood untuk ditampilkan.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ChevronLeft, ChevronRight };
