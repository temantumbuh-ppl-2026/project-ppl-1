"use client";

import { motion } from "framer-motion";
import { fadeUp, hoverCard, tapCard } from "./home-dashboard-motion";

export function SkeletonBox({ h = 120 }: { h?: number }) {
  return (
    <div
      className="rounded-[1rem]"
      style={{
        minHeight: h,
        background:
          "linear-gradient(110deg, rgba(196,224,220,0.45) 8%, rgba(255,255,255,0.75) 18%, rgba(196,224,220,0.45) 33%)",
        backgroundSize: "200% 100%",
        animation: "tt-skeleton 1.35s linear infinite",
        border: "1px solid rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    />
  );
}

export function MotionCard({
  children,
  className = "",
  style,
  custom = 0,
  liftOnHover = false,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  custom?: number;
  liftOnHover?: boolean;
}) {
  return (
    <motion.div
      custom={custom}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      whileHover={{
        ...(liftOnHover ? hoverCard : {}),
        boxShadow:
          "0 12px 36px rgba(26,150,136,0.13), 0 1.5px 0px rgba(255,255,255,0.95) inset",
      }}
      whileTap={liftOnHover ? tapCard : undefined}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function DonutRing({
  pct,
  color,
  size = 44,
  stroke = 5,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`${color}20`}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={circ - (pct / 100) * circ}
        strokeLinecap="round"
      />
    </svg>
  );
}
