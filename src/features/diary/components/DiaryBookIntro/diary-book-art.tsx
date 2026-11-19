"use client";

import { motion } from "framer-motion";
import { AnimatedShine, Grain, Shimmer } from "./diaryShared";

// ───────── ClosedBook (the closed diary at start) ─────────
export function ClosedBook({ opacity }: { opacity: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30, rotateX: -8 }}
      animate={{ opacity, scale: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        width: "clamp(170px, 38vw, 270px)",
        aspectRatio: "270 / 344",
        borderRadius:
          "clamp(6px, 1vw, 8px) clamp(12px, 2vw, 18px) clamp(12px, 2vw, 18px) clamp(6px, 1vw, 8px)",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glow ring */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          position: "absolute",
          inset: -12,
          borderRadius:
            "clamp(10px, 1.6vw, 14px) clamp(18px, 3vw, 26px) clamp(18px, 3vw, 26px) clamp(10px, 1.6vw, 14px)",
          background:
            "radial-gradient(ellipse, rgba(80,255,220,0.25) 0%, transparent 65%)",
          pointerEvents: "none",
          filter: "blur(14px)",
        }}
      />

      {/* Cover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius:
            "clamp(6px, 1vw, 8px) clamp(12px, 2vw, 18px) clamp(12px, 2vw, 18px) clamp(6px, 1vw, 8px)",
          background:
            "linear-gradient(150deg, #1D9A8D 0%, #166C67 40%, #0C4747 80%, #072E2E 100%)",
          overflow: "hidden",
          boxShadow:
            "6px 6px 32px rgba(0,0,0,0.55), 0 0 40px rgba(29,154,141,0.25), inset 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        <Grain />
        <Shimmer />
        <AnimatedShine />

        {/* Spine left edge */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "clamp(12px, 2.8vw, 18px)",
            background: "linear-gradient(90deg,#051E1E 0%,#083030 100%)",
            borderRadius: "clamp(6px, 1vw, 8px) 0 0 clamp(6px, 1vw, 8px)",
          }}
        />

        {/* Decorative borders */}
        <div
          style={{
            position: "absolute",
            inset: "clamp(12px, 3vw, 20px)",
            border: "1px solid rgba(100,220,200,0.24)",
            borderRadius: "clamp(6px, 1.4vw, 8px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "clamp(18px, 4vw, 26px)",
            border: "0.5px solid rgba(100,220,200,0.12)",
            borderRadius: "clamp(4px, 1vw, 6px)",
          }}
        />

        <ClosedCoverContent />
      </div>

      {/* Bookmark */}
      <motion.div
        animate={{ rotate: [0, 1.2, 0, -1.2, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          right: "clamp(-8px, -1.2vw, -10px)",
          top: "clamp(9px, 2vw, 14px)",
          bottom: "clamp(9px, 2vw, 14px)",
          width: "clamp(8px, 1.8vw, 12px)",
          borderRadius: 4,
          background: "linear-gradient(90deg,#D6C89A 0%,#C8B882 100%)",
          boxShadow:
            "2px 0 8px rgba(0,0,0,0.3), inset 0 0 0 0.5px rgba(120,90,30,0.25)",
          transformOrigin: "top center",
        }}
      />
    </motion.div>
  );
}

// ───────── OpenBook (pages, spine, flipping flap) ─────────
export function OpenBook({
  opacity,
  coverDeg,
  cursorVisible,
}: {
  opacity: number;
  coverDeg: number;
  cursorVisible: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        width: "clamp(300px, 82vw, 560px)",
        aspectRatio: "560 / 340",
        transformStyle: "preserve-3d",
        display: "flex",
        alignItems: "stretch",
        opacity,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* Left page */}
      <OpenPage side="left">
        <PageLabel>Kemarin</PageLabel>
        <RuledLines />
        {[
          { top: "17.6%", width: "66%" },
          { top: "24.7%", width: "80%" },
          { top: "31.8%", width: "58%" },
          { top: "38.8%", width: "75%" },
          { top: "45.9%", width: "61%" },
          { top: "52.9%", width: "84%" },
          { top: "60%", width: "48%" },
        ].map(({ top, width }, i) => (
          <FakeText key={i} top={top} left="10%" width={width} />
        ))}
      </OpenPage>

      {/* Right page */}
      <OpenPage side="right">
        <PageLabel right>Hari ini</PageLabel>
        <RuledLines right />
        {[
          { top: "17.6%", width: "70%" },
          { top: "24.7%", width: "60%" },
          { top: "31.8%", width: "82%" },
        ].map(({ top, width }, i) => (
          <FakeText key={i} top={top} left="7.2%" width={width} />
        ))}

        {/* Blinking cursor */}
        <div
          style={{
            position: "absolute",
            top: "31.8%",
            left: "calc(7.2% + 82% + 4px)",
            width: 2,
            height: "4.2%",
            minHeight: 8,
            maxHeight: 14,
            background: "#1D9A8D",
            borderRadius: 1,
            opacity: cursorVisible ? 1 : 0,
            transition: "opacity 0.12s",
            boxShadow: cursorVisible ? "0 0 8px rgba(29,154,141,0.7)" : "none",
          }}
        />
      </OpenPage>

      {/* Spine */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "clamp(16px, 4vw, 28px)",
          transform: "translateX(-50%)",
          background:
            "linear-gradient(90deg,#B89050 0%,#D4AA6A 30%,#C89848 60%,#A07838 100%)",
          boxShadow:
            "inset 0 0 8px rgba(0,0,0,0.12), inset 1px 0 0 rgba(255,255,255,0.18)",
          zIndex: 5,
        }}
      />

      {/* Spine shadow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          bottom: 0,
          width: "clamp(36px, 9vw, 64px)",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, transparent 72%)",
          pointerEvents: "none",
          zIndex: 6,
        }}
      />

      {/* Flipping cover flap */}
      <CoverFlap deg={coverDeg} />
    </div>
  );
}

// ───────── CoverFlap (the rotating cover) ─────────
function CoverFlap({ deg }: { deg: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: 0,
        width: "50%",
        height: "100%",
        transformOrigin: "left center",
        transformStyle: "preserve-3d",
        transform: `rotateY(${deg}deg)`,
        zIndex: 10,
        willChange: "transform",
      }}
    >
      {/* Front face (cover exterior) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          borderRadius: "0 clamp(12px, 2vw, 18px) clamp(12px, 2vw, 18px) 0",
          background:
            "linear-gradient(150deg,#1D9A8D 0%,#166C67 40%,#0C4747 80%,#072E2E 100%)",
          overflow: "hidden",
          boxShadow:
            "4px 0 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <Grain />
        <Shimmer />
        <AnimatedShine />
        <div
          style={{
            position: "absolute",
            inset: "clamp(12px, 3vw, 20px)",
            border: "1px solid rgba(100,220,200,0.18)",
            borderRadius: "clamp(6px, 1.4vw, 8px)",
          }}
        />
        <MinimalFlapContent />
      </div>

      {/* Back face (cover interior — cream) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderRadius: "0 clamp(12px, 2vw, 18px) clamp(12px, 2vw, 18px) 0",
          background: "linear-gradient(160deg,#FDF6E0 0%,#EDD9B2 100%)",
          boxShadow: "inset 8px 0 18px rgba(0,0,0,0.07)",
        }}
      />
    </div>
  );
}

// ───────── ClosedCoverContent (text on closed book) ─────────
function ClosedCoverContent() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(18px, 5vw, 36px) clamp(16px, 4vw, 28px)",
        textAlign: "center",
        color: "#C8F5EE",
      }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "clamp(26px, 8vw, 40px)" }}
        transition={{ delay: 0.4, duration: 0.7, ease: "easeOut" }}
        style={{
          height: 1,
          background: "rgba(120,220,200,0.5)",
          margin: "0 auto 12px",
        }}
      />
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        style={{
          margin: 0,
          fontFamily: "sans-serif",
          fontSize: "clamp(8px, 2vw, 10px)",
          fontWeight: 700,
          letterSpacing: "clamp(1.5px, 0.6vw, 3px)",
          textTransform: "uppercase",
          color: "rgba(160,235,220,0.7)",
          marginBottom: 10,
        }}
      >
        TemanCerita
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.75, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{
          margin: 0,
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "clamp(22px, 5.5vw, 34px)",
          fontWeight: 900,
          lineHeight: 1.08,
          color: "#E8FBF8",
          textShadow:
            "0 2px 16px rgba(0,0,0,0.5), 0 0 24px rgba(120,255,220,0.25)",
          marginBottom: 10,
        }}
      >
        Teman
        <br />
        Tumbuh
      </motion.h1>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "clamp(26px, 8vw, 40px)" }}
        transition={{ delay: 0.95, duration: 0.7, ease: "easeOut" }}
        style={{
          height: 1,
          background: "rgba(120,220,200,0.5)",
          margin: "0 auto 10px",
        }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        style={{
          margin: 0,
          fontFamily: "sans-serif",
          fontSize: "clamp(9px, 2.3vw, 12px)",
          lineHeight: 1.6,
          color: "rgba(190,240,230,0.7)",
        }}
      >
        Ruang refleksi harian
        <br />
        yang tenang &amp; hangat
      </motion.p>
    </div>
  );
}

// ───────── MinimalFlapContent (text on flap exterior) ─────────
function MinimalFlapContent() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <div
          style={{
            width: "clamp(24px, 7vw, 38px)",
            height: 1,
            background: "rgba(120,220,200,0.42)",
            margin: "0 auto 12px",
          }}
        />
        <p
          style={{
            margin: 0,
            fontFamily: "sans-serif",
            fontSize: "clamp(8px, 2vw, 9.5px)",
            fontWeight: 700,
            letterSpacing: "clamp(1.6px, 0.5vw, 2.8px)",
            textTransform: "uppercase",
            color: "rgba(160,235,220,0.58)",
          }}
        >
          TemanCerita
        </p>
        <div
          style={{
            width: "clamp(24px, 7vw, 38px)",
            height: 1,
            background: "rgba(120,220,200,0.42)",
            margin: "12px auto 0",
          }}
        />
      </div>
    </div>
  );
}

// ───────── Page primitives ─────────
function OpenPage({
  side,
  children,
}: {
  side: "left" | "right";
  children: React.ReactNode;
}) {
  const isLeft = side === "left";

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        borderRadius: isLeft
          ? "clamp(12px, 2vw, 18px) 0 0 clamp(12px, 2vw, 18px)"
          : "0 clamp(12px, 2vw, 18px) clamp(12px, 2vw, 18px) 0",
        background: isLeft
          ? "linear-gradient(160deg,#FFFCF3 0%,#F5E8C8 100%)"
          : "linear-gradient(160deg,#FEFBF0 0%,#F2E4C2 100%)",
        boxShadow: isLeft
          ? "-4px 0 20px rgba(0,0,0,0.3), inset 4px 0 12px rgba(180,140,80,0.08)"
          : "4px 0 20px rgba(0,0,0,0.3), inset -4px 0 12px rgba(180,140,80,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function PageLabel({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: boolean;
}) {
  return (
    <p
      style={{
        position: "absolute",
        top: "clamp(10px, 4vw, 20px)",
        left: right ? "7.2%" : "10%",
        margin: 0,
        fontFamily: "sans-serif",
        fontSize: "clamp(7px, 1.8vw, 9px)",
        fontWeight: 700,
        letterSpacing: "clamp(1.4px, 0.5vw, 2.5px)",
        textTransform: "uppercase",
        color: "rgba(130,90,40,0.45)",
      }}
    >
      {children}
    </p>
  );
}

function RuledLines({ right }: { right?: boolean }) {
  const tops = [
    "12.9%",
    "20%",
    "27.1%",
    "34.1%",
    "41.2%",
    "48.2%",
    "55.3%",
    "62.3%",
    "69.4%",
    "76.5%",
    "83.5%",
  ];

  return (
    <>
      {tops.map((top) => (
        <div
          key={top}
          style={{
            position: "absolute",
            left: right ? "7.2%" : "10%",
            right: right ? "10%" : "6.4%",
            top,
            height: 1,
            background: "rgba(140,100,50,0.14)",
          }}
        />
      ))}
    </>
  );
}

function FakeText({
  top,
  left,
  width,
}: {
  top: string;
  left: string;
  width: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left,
        width,
        height: 2,
        borderRadius: 2,
        background: "rgba(130,95,45,0.2)",
      }}
    />
  );
}
