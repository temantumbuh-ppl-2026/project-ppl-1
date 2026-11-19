"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Blob } from "@/components/ui/manual/blob";

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
      className={cn(
        "relative w-full overflow-hidden",
        fillViewport ? "min-h-screen" : "min-h-full",
        className,
      )}
      style={{
        background:
          "linear-gradient(180deg, #F8FCFC 0%, #F6FAFA 48%, #F4F8F8 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Blob
          w={360}
          h={360}
          color="rgba(26, 150, 136, 0.08)"
          style={{ top: -100, right: -80 }}
          duration={20}
          animate={{ y: [0, 18, 0], x: [0, -14, 0] }}
        />

        <Blob
          w={240}
          h={240}
          color="rgba(26, 150, 136, 0.05)"
          style={{ bottom: -70, left: -40 }}
          duration={24}
          delay={1.5}
          animate={{ y: [0, -14, 0], x: [0, 10, 0] }}
        />

        <Blob
          w={140}
          h={140}
          color="rgba(26, 150, 136, 0.04)"
          style={{ top: "38%", right: "18%" }}
          duration={16}
          delay={2}
          animate={{ scale: [1, 1.06, 1], y: [0, 10, 0] }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
