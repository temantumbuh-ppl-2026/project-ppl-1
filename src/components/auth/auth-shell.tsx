"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

import {
  fadeUpVariants,
  logoDropVariants,
  springBouncy,
  springSmooth,
} from "@/lib/animations";

interface AuthShellProps {
  children: ReactNode;
  footer?: ReactNode;
  showLogo?: boolean;
  showTopBar?: boolean;
  maxWidth?: number;
  compact?: boolean;
}

export function AuthShell({
  children,
  footer,
  showLogo = true,
  compact = true,
  maxWidth = 420,
}: AuthShellProps) {
  const shouldReduce = useReducedMotion();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-3 sm:px-6 sm:py-4">
      <motion.div
        initial={shouldReduce ? false : "hidden"}
        animate="visible"
        variants={fadeUpVariants}
        transition={springBouncy}
        className="relative w-full overflow-hidden rounded-[24px]"
        style={{
          maxWidth: maxWidth,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(190, 227, 221, 0.9)",
          boxShadow:
            "0 18px 50px rgba(15, 23, 42, 0.07), 0 4px 14px rgba(15, 23, 42, 0.04)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div
          className={
            compact
              ? "px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6"
              : "px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8"
          }
        >
          {showLogo ? (
            <motion.div
              initial={shouldReduce ? false : "hidden"}
              animate="visible"
              variants={logoDropVariants}
              transition={{ ...springSmooth, delay: 0.05 }}
              className="mb-4 flex justify-center"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl">
                <Image
                  src="/img/LOGO_TEMANTUMBUH.svg"
                  alt="TemanTumbuh"
                  width={40}
                  height={40}
                />
              </div>
            </motion.div>
          ) : null}

          {children}
        </div>

        {footer ? (
          <div
            className="px-5 pb-4 pt-3 text-center text-[11px] sm:px-6"
            style={{
              color: "var(--color-text-brand-muted)",
              borderTop: "1px solid var(--color-brand-border)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
