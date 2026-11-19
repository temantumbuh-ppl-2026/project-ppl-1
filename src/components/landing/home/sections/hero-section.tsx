"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { ReactNode } from "react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { heroMoodIcons } from "@/components/landing/home/home-content";
import {
  FloatingOrbs,
  type FloatingOrbItem,
} from "@/components/landing/home/reused/floating-orbs";
import { WaveBottom } from "@/components/landing/home/reused/wave-divider";

const heroOrbs: FloatingOrbItem[] = [
  {
    className:
      "right-10 bottom-14 h-28 w-28 border-2 border-brand-teal-pale opacity-30",
    x: [0, -6, 3, 0],
    y: [0, -14, 6, 0],
    duration: 9,
    delay: 0.6,
  },
  {
    className:
      "left-16 top-20 h-24 w-24 border-2 border-brand-teal-mid opacity-25",
    x: [0, 8, -4, 0],
    y: [0, 16, -8, 0],
    duration: 11,
    delay: 2.4,
  },
];

type HeroPolaroidProps = {
  src: string;
  alt: string;
  label: string;
  rotate?: number;
  className?: string;
};

function HeroPolaroid({
  src,
  alt,
  label,
  rotate = 0,
  className = "",
}: HeroPolaroidProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotate: rotate - 2, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, rotate, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, rotate: rotate + 1, scale: 1.02 }}
      className={className}
      style={{ transformOrigin: "center center" }}
    >
      <div className="w-55 overflow-hidden rounded-2xl border border-brand-border bg-white p-3 pb-10 shadow-[0_18px_48px_rgba(26,40,64,0.16),0_6px_18px_rgba(26,40,64,0.10)]">
        <div className="relative h-55 w-full overflow-hidden rounded-xl bg-page-bg1">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>

        <div className="pt-3 text-center">
          <p className="text-sm font-semibold text-text-brand-primary">
            {label}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

type HeroFloatingCardProps = {
  title: string;
  subtitle: string;
  className?: string;
  accent?: "teal" | "green";
  children?: ReactNode;
};

function HeroFloatingCard({
  title,
  subtitle,
  className = "",
  accent = "teal",
  children,
}: HeroFloatingCardProps) {
  const iconTone =
    accent === "green"
      ? "bg-emerald-100/80 text-emerald-600"
      : "bg-brand-teal-ghost text-brand-teal";
  const subtitleTone =
    accent === "green" ? "text-emerald-600" : "text-brand-teal";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.55 },
        scale: { duration: 0.55 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      className={className}
    >
      <div className="rounded-2xl border border-brand-border bg-white px-4 py-3 shadow-[0_12px_30px_rgba(26,40,64,0.12)]">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconTone}`}
          >
            {children}
          </div>
          <div>
            <p className="text-xs font-bold text-text-brand-primary">{title}</p>
            <p className={`text-[11px] ${subtitleTone}`}>{subtitle}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HeroMoodCard({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.5 },
        scale: { duration: 0.5 },
        y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      className={className}
    >
      <div className="rounded-2xl border border-brand-border bg-white p-3 shadow-[0_12px_30px_rgba(26,40,64,0.12)]">
        <p className="mb-1 text-xs font-semibold text-text-brand-primary">
          Mood Hari Ini
        </p>

        <div className="flex gap-1.5">
          {heroMoodIcons.map((src, index) => (
            <div
              key={src}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                index === 4 ? "bg-teal-50 ring-2 ring-teal-500" : "bg-slate-50"
              }`}
            >
              <Image
                src={src}
                alt="mood"
                width={20}
                height={20}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function HomeHeroSection() {
  const { scrollY } = useScroll();
  const heroParallax = useTransform(scrollY, [0, 400], [0, -50]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.5]);
  const springY = useSpring(heroParallax, { stiffness: 80, damping: 20 });

  return (
    <section className="relative flex min-h-[calc(100vh-64px)] items-center overflow-hidden bg-[linear-gradient(160deg,var(--color-page-bg0)_0%,var(--color-page-bg1)_100%)] pb-18">
      <WaveBottom fill="var(--color-page-bg1)" />
      <FloatingOrbs items={heroOrbs} />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-30 -top-30 h-140 w-140 rounded-full bg-[radial-gradient(circle_at_40%_40%,var(--color-brand-teal-ghost)_0%,transparent_60%)]"
          style={{ y: springY, opacity: heroOpacity }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <ScrollReveal delay={0.2}>
            <h1 className="mb-5 text-4xl font-bold leading-[1.1] text-text-brand-primary md:text-5xl lg:text-6xl">
              AI Diary untuk{" "}
              <span className="text-brand-teal">Dukungan Emosional</span> &amp;
              Keamanan Diri
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.35}>
            <p className="mb-8 max-w-md text-sm leading-relaxed text-text-brand-secondary md:text-base">
              Platform refleksi diri dan kesadaran emosional untuk usia 10–29
              tahun. Ceritakan harimu, lacak moodmu, dan tumbuh bersama AI yang
              peduli.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.45}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-brand-teal px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-teal-dark active:scale-[0.97]"
              >
                Mulai Sekarang
              </Link>

              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-brand-border px-6 py-3.5 text-sm font-semibold text-text-brand-primary transition-all hover:bg-page-bg1"
              >
                Lihat Fitur
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <div
          className="relative hidden items-center justify-center md:flex"
          style={{ height: 460 }}
        >
          <div className="relative h-105 w-full max-w-115">
            <HeroPolaroid
              src="/img/hero-polaroid-1.jpg"
              alt="Diary reflection"
              label="Ceritakan harimu"
              rotate={-6}
              className="absolute bottom-2 left-0 z-20"
            />

            <HeroPolaroid
              src="/img/hero-polaroid-2.jpg"
              alt="Mood support"
              label="Tumbuh lebih tenang"
              rotate={7}
              className="absolute right-2 top-2 z-10"
            />

            <HeroFloatingCard
              title="Mood Check-in"
              subtitle="Streak 12 hari!"
              accent="green"
              className="absolute left-1/2 top-0 z-30 -translate-x-1/2"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </HeroFloatingCard>
          </div>

          <HeroMoodCard className="absolute bottom-6 right-0 z-30" />
        </div>
      </div>
    </section>
  );
}
