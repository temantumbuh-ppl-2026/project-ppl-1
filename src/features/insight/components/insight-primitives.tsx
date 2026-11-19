"use client";

import { CalendarDays } from "lucide-react";
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
  return <section className={cn("ins-card", className)}>{children}</section>;
}

export function TopCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <SurfaceCard className={className}>{children}</SurfaceCard>;
}

export function TopCardHeader({
  title,
  subtitle,
  kicker,
  right,
}: {
  title: string;
  subtitle: string;
  kicker?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="ins-card-head">
      <div className="min-w-0">
        {kicker ? <span className="ins-kicker">{kicker}</span> : null}
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {right}
    </div>
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
      className={cn("ins-date-btn", active && "is-today")}
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
      className="ins-date-btn"
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
    <button type="button" onClick={onClick} className="ins-date-label">
      <CalendarDays size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export function PriorityBadge({ priority }: { priority: ActionPriority }) {
  const config = PRIORITY_STYLE[priority];

  return (
    <span
      className="ins-badge"
      style={{
        background: config.bg,
        color: config.text,
        borderColor: config.ring,
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
    <div className="ins-chart-tip">
      <strong>{`Tanggal ${label}`}</strong>
      <span>Mood {payload[0]?.value}/5</span>
    </div>
  );
}

/**
 * NotebookReflection — halaman buku catatan bergaris dengan margin tipis di
 * kiri. Teks refleksi memakai Plus Jakarta agar tetap mudah dibaca.
 */
export function NotebookReflection({ text }: { text: string }) {
  return (
    <div className="ins-lined">
      <p>“{text}”</p>
    </div>
  );
}

/** QuoteBlock — kartu pengingat teal gelap dengan kutipan afirmasi. */
export function QuoteBlock({ text }: { text: string }) {
  return (
    <aside className="ins-reminder" aria-label="Pengingat hari ini">
      <span className="hand">pengingat untukmu</span>
      <b aria-hidden="true">“</b>
      <blockquote>{text}</blockquote>
      <svg viewBox="0 0 150 25" aria-hidden="true">
        <path d="M3 15c27-12 48 8 74-2 25-9 43-6 69 2" />
      </svg>
    </aside>
  );
}

export function InsightPlaceholderCard({ title }: { title: string }) {
  return (
    <div className="ins-ghost">
      <span>{title}</span>
      <i style={{ width: "85%" }} />
      <i style={{ width: "72%" }} />
    </div>
  );
}

export function EmptyReflectionState({ isToday }: { isToday: boolean }) {
  return (
    <div className="ins-ghost">
      <i style={{ width: "76%" }} />
      <i style={{ width: "62%" }} />
      <i style={{ width: "67%" }} />
      <p className="ins-empty-note">
        {isToday
          ? "Insight hari ini belum tersedia. Tekan tombol di atas untuk melihat ringkasannya."
          : "Belum ada insight untuk tanggal ini."}
      </p>
    </div>
  );
}

export function TrendPlaceholder() {
  return (
    <div className="ins-chart-empty" role="status">
      Belum ada data mood untuk ditampilkan.
    </div>
  );
}
