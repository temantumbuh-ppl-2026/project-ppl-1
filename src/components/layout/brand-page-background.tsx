"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface BrandPageBackgroundProps {
  children: ReactNode;
  className?: string;
  fillViewport?: boolean;
}

export function BrandPageBackground({
  children,
  className,
  fillViewport = false,
}: BrandPageBackgroundProps) {
  return (
    <div
      data-slot="brand-page-background"
      className={cn(
        "relative w-full overflow-hidden",
        fillViewport ? "min-h-screen" : "min-h-full",
        className,
      )}
      style={{
        background: "var(--tt-gray-50)",
      }}
    >
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
