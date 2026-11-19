"use client";

import { usePathname } from "next/navigation";

type RouteLoadingVariant =
  | "dashboard"
  | "diary"
  | "insight"
  | "profile"
  | "subscription";

export function RouteLoadingByPath() {
  const pathname = usePathname();
  const variant = getRouteLoadingVariant(pathname);

  return (
    <RouteLoadingShell
      label={getRouteLoadingLabel(variant)}
      variant={variant}
    />
  );
}

export function RouteLoadingShell({
  label = "Memuat halaman...",
  variant = "dashboard",
}: {
  label?: string;
  variant?: RouteLoadingVariant;
}) {
  if (variant === "diary") {
    return <DiaryLoading label={label} />;
  }

  if (variant === "insight") {
    return (
      <ShellFrame label={label}>
        <InsightSkeleton />
      </ShellFrame>
    );
  }

  if (variant === "subscription") {
    return (
      <ShellFrame label={label}>
        <SubscriptionSkeleton />
      </ShellFrame>
    );
  }

  if (variant === "profile") {
    return (
      <ShellFrame label={label}>
        <ProfileSkeleton />
      </ShellFrame>
    );
  }

  return (
    <ShellFrame label={label}>
      <DashboardSkeleton />
    </ShellFrame>
  );
}

function getRouteLoadingVariant(pathname: string): RouteLoadingVariant {
  if (pathname.startsWith("/diary")) return "diary";
  if (pathname.startsWith("/insight")) return "insight";
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/subscription")) return "subscription";
  return "dashboard";
}

function getRouteLoadingLabel(variant: RouteLoadingVariant) {
  if (variant === "diary") return "Memuat diary...";
  if (variant === "insight") return "Memuat insight...";
  if (variant === "profile") return "Memuat profil...";
  if (variant === "subscription") return "Memuat subscription...";
  return "Memuat dashboard...";
}

function ShellFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <main
      className="tt-dashboard-scroll-y h-full min-h-0 w-full bg-[var(--tt-dashboard-page-bg)] px-4 py-4 md:px-6 md:py-5"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-6xl">
        {children}
        <p className="sr-only">{label}</p>
      </div>
    </main>
  );
}

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-[1.15rem] ${className}`}
      style={{
        background:
          "linear-gradient(110deg, rgba(196,224,220,0.45) 8%, rgba(255,255,255,0.75) 18%, rgba(196,224,220,0.45) 33%)",
        backgroundSize: "200% 100%",
        animation: "tt-skeleton 1.35s linear infinite",
        border: "1px solid rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        ...style,
      }}
    />
  );
}

function DiaryLoading({ label }: { label: string }) {
  return (
    <main
      className="flex h-full min-h-[100dvh] w-full items-center justify-center bg-[var(--tt-dashboard-page-bg)] px-5"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className="animate-spin"
          style={{ animationDuration: "0.8s" }}
        >
          <circle
            cx="18"
            cy="18"
            r="15"
            stroke="var(--color-brand-teal-ghost, #DDF5F2)"
            strokeWidth="3"
          />
          <path
            d="M18 3a15 15 0 0115 15"
            stroke="var(--color-brand-teal, #1A9688)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <p
          className="text-center text-sm"
          style={{ color: "var(--color-text-brand-muted, #6B7C93)" }}
        >
          {label}
        </p>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <SkeletonBlock className="mb-5 h-5 w-44 rounded-full" />
      <div className="grid gap-3 xl:grid-cols-[280px_1fr]">
        <SkeletonBlock className="h-[220px]" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-[108px]" />
          <SkeletonBlock className="h-[108px]" />
          <SkeletonBlock className="h-[88px]" />
          <SkeletonBlock className="h-[88px]" />
        </div>
      </div>
      <SkeletonBlock className="mt-3 h-[72px]" />
      <SkeletonBlock className="mt-3 h-[300px]" />
    </>
  );
}

function InsightSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="mt-3 h-8 w-52 rounded-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-10 rounded-2xl" />
          <SkeletonBlock className="h-10 w-36 rounded-2xl" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
        <div className="space-y-4">
          <section className="tt-dashboard-card rounded-[1.15rem] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <SkeletonBlock className="h-4 w-32 rounded-full" />
                <SkeletonBlock className="mt-2 h-3 w-48 rounded-full" />
              </div>
              <SkeletonBlock className="h-9 w-24 rounded-2xl" />
            </div>
            <div className="flex h-[230px] items-end gap-2 px-1 pb-2">
              {[42, 70, 54, 86, 62, 76, 48, 92, 66, 58, 80, 50].map(
                (height, index) => (
                  <SkeletonBlock
                    key={index}
                    className="flex-1 rounded-t-xl rounded-b-md"
                    style={{ height }}
                  />
                ),
              )}
            </div>
          </section>

          <section className="tt-dashboard-card rounded-[1.15rem] p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <SkeletonBlock className="h-5 w-40 rounded-full" />
                <SkeletonBlock className="mt-2 h-3 w-56 rounded-full" />
              </div>
              <SkeletonBlock className="h-10 w-10 rounded-2xl" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock className="h-4 w-[96%] rounded-full" />
              <SkeletonBlock className="h-4 w-[86%] rounded-full" />
              <SkeletonBlock className="h-4 w-[92%] rounded-full" />
              <SkeletonBlock className="h-4 w-[68%] rounded-full" />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="tt-dashboard-card rounded-[1.15rem] p-4">
            <SkeletonBlock className="h-4 w-32 rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
              <SkeletonBlock className="h-20 rounded-2xl" />
            </div>
          </section>
          <section className="tt-dashboard-card rounded-[1.15rem] p-4">
            <SkeletonBlock className="h-4 w-36 rounded-full" />
            <div className="mt-4 space-y-3">
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <section className="tt-dashboard-card rounded-[28px] px-5 py-6 md:px-7 md:py-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="mt-3 h-10 w-64 rounded-full" />
            <SkeletonBlock className="mt-3 h-4 w-[min(520px,90%)] rounded-full" />
            <SkeletonBlock className="mt-2 h-4 w-[min(420px,75%)] rounded-full" />
          </div>
          <SkeletonBlock className="h-8 w-32 rounded-full" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <SubscriptionPlanSkeleton compact />
        <SubscriptionPlanSkeleton featured />
      </div>
    </div>
  );
}

function SubscriptionPlanSkeleton({
  compact = false,
  featured = false,
}: {
  compact?: boolean;
  featured?: boolean;
}) {
  return (
    <section
      className={`tt-dashboard-card rounded-[28px] p-5 md:p-6 ${
        featured ? "min-h-[420px]" : "min-h-[360px]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <SkeletonBlock className="h-3 w-24 rounded-full" />
          <SkeletonBlock className="mt-3 h-9 w-36 rounded-full" />
        </div>
        <SkeletonBlock className="h-7 w-16 rounded-full" />
      </div>

      <div className="mt-7 space-y-3">
        <FeatureSkeletonRow />
        <FeatureSkeletonRow />
        <FeatureSkeletonRow />
        {!compact ? <FeatureSkeletonRow /> : null}
      </div>

      {featured ? (
        <div className="mt-7 space-y-4">
          <SkeletonBlock className="h-3 w-32 rounded-full" />
          <div className="grid grid-cols-4 gap-2">
            <SkeletonBlock className="h-11 rounded-xl" />
            <SkeletonBlock className="h-11 rounded-xl" />
            <SkeletonBlock className="h-11 rounded-xl" />
            <SkeletonBlock className="h-11 rounded-xl" />
          </div>
          <SkeletonBlock className="h-4 w-40 rounded-full" />
          <SkeletonBlock className="h-12 rounded-[16px]" />
        </div>
      ) : (
        <SkeletonBlock className="mt-7 h-12 rounded-[16px]" />
      )}
    </section>
  );
}

function FeatureSkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-[rgba(26,150,136,0.04)] px-3.5 py-3">
      <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
      <SkeletonBlock className="h-4 w-full rounded-full" />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="h-10 w-48 animate-pulse rounded-full bg-white/70" />
      <div className="overflow-hidden rounded-[20px] bg-white shadow-sm">
        <div className="h-16 animate-pulse border-b border-slate-200 bg-slate-50" />
        <div className="space-y-px">
          <div className="h-20 animate-pulse bg-white" />
          <div className="h-20 animate-pulse bg-slate-50/70" />
          <div className="h-20 animate-pulse bg-white" />
          <div className="h-20 animate-pulse bg-slate-50/70" />
        </div>
      </div>
    </div>
  );
}
