import Link from "next/link";

import {
  homeHowTracks,
  type HomeHowTrack,
} from "@/components/landing/home/home-content";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FloatingOrbs } from "@/components/landing/home/reused/floating-orbs";
import { SectionIntro } from "@/components/landing/home/reused/section-intro";
import {
  WaveBottom,
  WaveTop,
} from "@/components/landing/home/reused/wave-divider";

const themeClasses: Record<
  HomeHowTrack["theme"],
  {
    tag: string;
    text: string;
    indexBubble: string;
    cta: string;
    card: string;
  }
> = {
  teal: {
    tag: "border border-brand-teal-pale bg-brand-teal-ghost text-brand-teal",
    text: "text-brand-teal",
    indexBubble: "bg-brand-teal-ghost",
    cta: "bg-brand-teal text-white hover:bg-brand-teal-dark",
    card: "bg-white/90",
  },
  gold: {
    tag: "border border-[var(--color-accent-gold-border)] bg-[var(--color-accent-gold-ghost)] text-[var(--color-accent-gold-text)]",
    text: "text-[var(--color-accent-gold-text-deep)]",
    indexBubble: "bg-[var(--color-accent-gold-ghost-strong)]",
    cta: "bg-[var(--color-accent-gold-cta)] text-white hover:bg-[var(--color-accent-gold-cta-hover)]",
    card: "bg-[linear-gradient(140deg,var(--color-accent-gold-soft)_0%,var(--color-accent-gold-soft-2)_100%)]",
  },
};

function HomeHowTrackCard({ track }: { track: HomeHowTrack }) {
  const tone = themeClasses[track.theme];

  return (
    <article
      className={`flex h-full flex-col gap-4 rounded-2xl border border-brand-border p-6 md:p-8 ${tone.card}`}
    >
      <span
        className={`self-start rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ${tone.tag}`}
      >
        {track.tag}
      </span>

      <h3 className={`text-base font-bold md:text-lg ${tone.text}`}>
        {track.title}
      </h3>

      <ul className="flex flex-1 flex-col gap-2">
        {track.bulletPoints.map((point, index) => (
          <li
            key={point}
            className={`flex items-start gap-2 text-xs ${tone.text}`}
          >
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${tone.indexBubble}`}
            >
              {index + 1}
            </span>
            {point}
          </li>
        ))}
      </ul>

      <Link
        href="/register"
        className={`inline-flex self-start rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${tone.cta}`}
      >
        {track.ctaLabel}
      </Link>
    </article>
  );
}

export function HomeHowSection() {
  return (
    <section
      id="how"
      className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-page-bg2)_0%,var(--color-page-how-bg)_100%)] py-16 md:py-24"
    >
      <WaveTop fill="var(--color-page-bg2)" />
      <WaveBottom fill="var(--color-page-how-bg)" />

      <FloatingOrbs
        items={[
          {
            className:
              "-right-20 -top-16 h-80 w-80 bg-[radial-gradient(circle,var(--color-brand-teal-pale)_0%,transparent_65%)] opacity-45",
            x: [0, -14, 4, 0],
            y: [0, 22, -8, 0],
            duration: 13,
            delay: 0,
          },
          {
            className:
              "-left-16 -bottom-16 h-60 w-60 bg-[radial-gradient(circle,var(--color-brand-teal-ghost)_0%,transparent_65%)] opacity-38",
            x: [0, 10, -4, 0],
            y: [0, -18, 6, 0],
            duration: 10,
            delay: 1.8,
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <SectionIntro
            badge="Cara Kerja"
            title="Bagaimana Cara Kerjanya?"
            description="Sederhana dan mudah digunakan oleh semua kalangan."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {homeHowTracks.map((track, index) => (
            <ScrollReveal key={track.title} delay={index * 0.1}>
              <HomeHowTrackCard track={track} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
