"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Floating leaf that falls all the way to the bottom
function FloatingLeaf({
  delay,
  x,
  size,
  duration,
}: {
  delay: number;
  x: string;
  size: number;
  duration: number;
}) {
  return (
    <motion.div
      className="pointer-events-none absolute top-0"
      style={{ left: x }}
      animate={{
        y: ["0vh", "100vh"],
        rotate: [0, 180, 360],
        x: [0, 15, -10, 8, 0],
      }}
      transition={{
        y: { duration, repeat: Infinity, delay, ease: "linear" },
        rotate: {
          duration: duration * 0.8,
          repeat: Infinity,
          delay,
          ease: "linear",
        },
        x: {
          duration: duration * 0.5,
          repeat: Infinity,
          delay,
          ease: "easeInOut",
        },
      }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <path
          d="M20 2C14 8 6 16 6 24c0 7.7 6.3 14 14 14s14-6.3 14-14C34 16 26 8 20 2z"
          fill="#4ecfc3"
          opacity="0.55"
        />
        <path d="M20 4v32" stroke="#1a9688" strokeWidth="1" opacity="0.5" />
        <path
          d="M20 14 Q14 18 12 24"
          stroke="#1a9688"
          strokeWidth="0.7"
          opacity="0.4"
          fill="none"
        />
        <path
          d="M20 18 Q26 22 28 26"
          stroke="#1a9688"
          strokeWidth="0.7"
          opacity="0.4"
          fill="none"
        />
      </svg>
    </motion.div>
  );
}

export default function NotFound() {
  // Generate many leaves with random-ish properties
  const leaves = [
    { delay: 0, x: "8%", size: 38, duration: 9 },
    { delay: 1.2, x: "82%", size: 30, duration: 11 },
    { delay: 2.5, x: "48%", size: 46, duration: 10 },
    { delay: 0.8, x: "92%", size: 24, duration: 12 },
    { delay: 3.5, x: "18%", size: 54, duration: 9.5 },
    { delay: 4.2, x: "65%", size: 34, duration: 11.5 },
    { delay: 5, x: "33%", size: 42, duration: 10.5 },
    { delay: 1.8, x: "4%", size: 28, duration: 13 },
    { delay: 6, x: "74%", size: 50, duration: 9.8 },
    { delay: 3, x: "55%", size: 26, duration: 12.5 },
    { delay: 7, x: "40%", size: 32, duration: 10.2 },
    { delay: 2, x: "88%", size: 44, duration: 11.2 },
    { delay: 4.8, x: "12%", size: 36, duration: 10.8 },
    { delay: 5.5, x: "60%", size: 40, duration: 9.2 },
    { delay: 6.5, x: "25%", size: 48, duration: 11.8 },
    { delay: 8, x: "70%", size: 22, duration: 13.5 },
    { delay: 7.5, x: "95%", size: 30, duration: 10 },
    { delay: 0.5, x: "52%", size: 56, duration: 12 },
  ];

  return (
    <div
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6"
      style={{
        background:
          "linear-gradient(180deg, #f0f7f6 0%, #e4f1ef 40%, #f5faf9 100%)",
      }}
    >
      {/* Falling leaves */}
      {leaves.map((leaf, i) => (
        <FloatingLeaf key={i} {...leaf} />
      ))}

      {/* Background decorative circles */}
      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(26,150,136,0.12) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(78,207,195,0.15) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Brand */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 text-[16px] font-extrabold uppercase tracking-[0.22em] sm:text-[18px]"
          style={{ color: "#1a9688" }}
        >
          TemanTumbuh
        </motion.p>

        {/* 404 — the "0" is a face */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex select-none items-center"
        >
          {/* "4" left */}
          <span
            className="text-[120px] font-black leading-none tracking-tighter sm:text-[160px] md:text-[200px]"
            style={{
              background:
                "linear-gradient(135deg, #144949 0%, #1a9688 40%, #4ecfc3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            4
          </span>

          {/* "0" as a face */}
          <motion.div
            className="relative mx-[-4px] sm:mx-0"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              className="h-[110px] w-[110px] sm:h-[145px] sm:w-[145px] md:h-[180px] md:w-[180px]"
              viewBox="0 0 120 120"
              fill="none"
            >
              {/* Circle face (the "0") */}
              <circle cx="60" cy="60" r="55" fill="url(#faceGradient)" />
              <circle cx="60" cy="60" r="48" fill="#22b8a6" opacity="0.3" />

              {/* Eyes */}
              <motion.g
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  repeatDelay: 2.5,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: "60px 50px" }}
              >
                <circle cx="44" cy="50" r="6" fill="white" />
                <circle cx="46" cy="51" r="3" fill="#144949" />
                <circle cx="47" cy="49" r="1.2" fill="white" />

                <circle cx="76" cy="50" r="6" fill="white" />
                <circle cx="78" cy="51" r="3" fill="#144949" />
                <circle cx="79" cy="49" r="1.2" fill="white" />
              </motion.g>

              {/* Confused/dizzy mouth */}
              <motion.path
                d="M42 75 Q50 68 58 75 Q66 82 74 75"
                stroke="#144949"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                animate={{
                  d: [
                    "M42 75 Q50 68 58 75 Q66 82 74 75",
                    "M42 73 Q50 80 58 73 Q66 66 74 73",
                    "M42 75 Q50 68 58 75 Q66 82 74 75",
                  ],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Blush */}
              <circle cx="36" cy="68" r="5" fill="#ff9f9f" opacity="0.3" />
              <circle cx="84" cy="68" r="5" fill="#ff9f9f" opacity="0.3" />

              {/* Sweat drop */}
              <motion.path
                d="M85 38 Q87 34 86 30"
                stroke="#7dd3fc"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                animate={{ opacity: [0, 1, 0], y: [0, 3, 6] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
              />

              <defs>
                <linearGradient
                  id="faceGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#1a9688" />
                  <stop offset="100%" stopColor="#148a7d" />
                </linearGradient>
              </defs>
            </svg>

            {/* Floating question mark */}
            <motion.span
              className="absolute -right-2 -top-2 text-[22px] font-black sm:-right-3 sm:-top-3 sm:text-[28px]"
              style={{ color: "#d6a11b" }}
              animate={{ y: [0, -4, 0], opacity: [0.7, 1, 0.7] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              ?
            </motion.span>
          </motion.div>

          {/* "4" right */}
          <span
            className="text-[120px] font-black leading-none tracking-tighter sm:text-[160px] md:text-[200px]"
            style={{
              background:
                "linear-gradient(135deg, #144949 0%, #1a9688 40%, #4ecfc3 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            4
          </span>
        </motion.div>

        {/* Text */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 text-[20px] font-bold sm:text-[24px]"
          style={{ color: "#16313b" }}
        >
          Halaman tidak ditemukan
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-3 max-w-sm text-[14px] leading-7 sm:text-[15px]"
          style={{ color: "#58707c" }}
        >
          Halaman yang kamu cari sepertinya sudah berpindah atau tidak tersedia.
          Ayo kembali dan lanjutkan perjalananmu!
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/home"
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full px-7 text-[14px] font-semibold text-white transition-all duration-200 hover:-translate-y-[2px]"
            style={{
              background: "linear-gradient(135deg, #144949 0%, #1a9688 100%)",
              boxShadow: "0 12px 28px rgba(26,150,136,0.25)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Kembali ke Dashboard
          </Link>

          <Link
            href="/diary"
            className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-full border px-7 text-[14px] font-semibold transition-all duration-200 hover:-translate-y-[2px]"
            style={{
              borderColor: "rgba(26,150,136,0.25)",
              color: "#1a9688",
              background: "rgba(255,255,255,0.8)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Tulis Diary
          </Link>
        </motion.div>

        {/* Animated wave dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-10 flex items-center gap-1.5"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: i % 2 === 0 ? "#1a9688" : "#4ecfc3" }}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
