"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { springSmooth } from "@/lib/animations";

interface AuthStepIndicatorProps {
  current: number;
  total: number;
  labels?: string[];
}

export function AuthStepIndicator({
  current,
  total,
  labels = ["Akun", "Data Diri", "Laporan"],
}: AuthStepIndicatorProps) {
  const safeLabels = labels.slice(0, total);

  return (
    <div className="mb-8 flex items-center justify-center">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current;
        const isActive = i === current;

        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{
                  background: isDone
                    ? "var(--color-brand-teal)"
                    : isActive
                      ? "#ffffff"
                      : "var(--color-page-bg1)",
                  borderColor:
                    isDone || isActive
                      ? "var(--color-brand-teal)"
                      : "var(--color-brand-border)",
                  scale: isActive ? 1.08 : 1,
                }}
                transition={springSmooth}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold"
                style={{
                  color: isDone
                    ? "#ffffff"
                    : isActive
                      ? "var(--color-brand-teal)"
                      : "var(--color-text-brand-muted)",
                }}
              >
                {isDone ? <Check className="h-4 w-4" /> : <span>{i + 1}</span>}
              </motion.div>

              <span
                className="mt-1.5 text-[10px] font-medium"
                style={{
                  color: isActive
                    ? "var(--color-brand-teal)"
                    : "var(--color-text-brand-muted)",
                }}
              >
                {safeLabels[i]}
              </span>
            </div>

            {i < total - 1 && (
              <div
                className="mx-1 mb-4 h-0.5 w-12 transition-colors duration-300"
                style={{
                  background:
                    i < current
                      ? "var(--color-brand-teal)"
                      : "var(--color-brand-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
