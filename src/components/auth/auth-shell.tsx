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
        className="relative w-full overflow-hidden rounded-tt-lg"
        style={{
          maxWidth: maxWidth,
          background: "var(--tt-surface)",
          border: "1px solid var(--tt-primary-200)",
          boxShadow: "var(--tt-shadow-elevated)",
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
              <div className="flex h-10 w-10 items-center justify-center rounded-tt-lg">
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
            className="tt-text-caption px-5 pb-4 pt-3 text-center sm:px-6"
            style={{
              color: "var(--tt-gray-600)",
              borderTop: "1px solid var(--tt-gray-200)",
            }}
          >
            {footer}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
