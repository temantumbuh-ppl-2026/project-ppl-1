import Link from "next/link";
import { Brain, Shield, Users } from "lucide-react";
import type { ComponentType } from "react";

import {
  homePurposeItems,
  type HomePurposeItem,
} from "@/components/landing/home/home-content";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FloatingOrbs } from "@/components/landing/home/reused/floating-orbs";
import { SectionIntro } from "@/components/landing/home/reused/section-intro";
import {
  WaveBottom,
  WaveTop,
} from "@/components/landing/home/reused/wave-divider";

const purposeIconMap: Record<
  HomePurposeItem["icon"],
  ComponentType<{ className?: string }>
> = {
  shield: Shield,
  users: Users,
  brain: Brain,
};

function HomePurposeCard({ item }: { item: HomePurposeItem }) {
  const Icon = purposeIconMap[item.icon];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-[0_2px_16px_rgba(26,40,64,0.07)] transition-transform duration-200 hover:-translate-y-1.5">
      <div className="flex h-28 items-center justify-center bg-[linear-gradient(140deg,var(--color-brand-teal-ghost)_0%,var(--color-page-bg5)_100%)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-teal-pale bg-white">
          <Icon className="h-6 w-6 text-brand-teal" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="w-fit rounded-full border border-brand-teal-pale bg-brand-teal-ghost px-2.5 py-1 text-xs font-semibold text-brand-teal">
          {item.tag}
        </span>
        <p className="text-sm font-semibold text-text-brand-primary">
          {item.title}
        </p>
        <p className="flex-1 text-xs leading-relaxed text-text-brand-secondary">
          {item.description}
        </p>

        <Link
          href="/about"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal transition-opacity hover:opacity-80"
        >
          Baca Selengkapnya
        </Link>
      </div>
    </article>
  );
}

export function HomePurposeSection() {
  return (
    <section
      id="purpose"
      className="relative overflow-hidden bg-[linear-gradient(160deg,var(--color-page-how-bg)_0%,var(--color-page-bg5)_100%)] py-20 md:py-28"
    >
      <WaveTop fill="var(--color-page-how-bg)" />
      <WaveBottom fill="var(--color-page-bg5)" />

      <FloatingOrbs
        items={[
          {
            className:
              "-left-20 -top-16 h-80 w-80 bg-[radial-gradient(circle,var(--color-brand-teal-ghost)_0%,transparent_65%)] opacity-40",
            x: [0, 14, -4, 0],
            y: [0, 20, -6, 0],
            duration: 11,
            delay: 0.5,
          },
          {
            className:
              "-right-16 -bottom-14 h-64 w-64 bg-[radial-gradient(circle,var(--color-page-bg5)_0%,transparent_68%)] opacity-35",
            x: [0, -10, 3, 0],
            y: [0, -18, 6, 0],
            duration: 14,
            delay: 2,
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <SectionIntro
            badge="Tujuan Kami"
            accent="TemanTumbuh"
            title="'s Tujuan"
            description="Kami percaya setiap remaja berhak mendapat ruang aman untuk tumbuh."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {homePurposeItems.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 0.1}>
              <HomePurposeCard item={item} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
