"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "linear-gradient(180deg, var(--tt-gray-50) 0%, var(--tt-gray-50) 40%, var(--tt-gray-50) 100%)",
      }}
    >
      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-[16px] font-extrabold uppercase tracking-[0.22em] sm:text-[18px]"
          style={{ color: "var(--tt-primary-500)" }}
        >
          TemanTumbuh
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="select-none text-[100px] font-black leading-none tracking-tighter sm:text-[140px]"
          style={{
            background:
              "linear-gradient(135deg, var(--tt-primary-900) 0%, var(--tt-primary-500) 40%, var(--tt-primary-300) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Oops!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-[18px] font-bold sm:text-[22px]"
          style={{ color: "var(--tt-gray-900)" }}
        >
          Terjadi kesalahan
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-3 max-w-sm text-[14px] leading-7"
          style={{ color: "var(--tt-gray-600)" }}
        >
          Sepertinya ada yang tidak beres. Coba kembali ke halaman utama atau
          muat ulang halaman ini.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/home"
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full px-7 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-[2px]"
            style={{
              background:
                "linear-gradient(135deg, var(--tt-primary-900) 0%, var(--tt-button-primary) 100%)",
              boxShadow:
                "0 12px 28px color-mix(in srgb, var(--tt-primary-500) 25%, transparent)",
            }}
          >
            Kembali ke Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
