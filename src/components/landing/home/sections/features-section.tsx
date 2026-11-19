import Image from "next/image";

import { homeFeatureItems } from "@/components/landing/home/home-content";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FloatingOrbs } from "@/components/landing/home/reused/floating-orbs";
import { SectionIntro } from "@/components/landing/home/reused/section-intro";
import {
  WaveBottom,
  WaveTop,
} from "@/components/landing/home/reused/wave-divider";

function HomeFeatureCard({
  iconSrc,
  title,
  description,
  badge,
}: {
  iconSrc: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <article className="group relative h-full cursor-pointer rounded-2xl border border-brand-border bg-white p-6 shadow-[0_2px_16px_rgba(26,40,64,0.07)] transition-transform duration-200 hover:-translate-y-1.5">
      <span className="absolute right-4 top-4 rounded-full border border-brand-teal-pale bg-brand-teal-ghost px-2 py-0.5 text-[10px] font-semibold text-brand-teal">
        {badge}
      </span>

      <div className="mb-4 mt-2 flex items-center justify-start">
        <Image
          width={60}
          height={60}
          src={iconSrc}
          alt={title}
          className="h-12 w-12 object-contain md:h-14 md:w-14"
        />
      </div>

      <h3 className="mb-2 text-sm font-bold text-text-brand-primary">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-text-brand-secondary">
        {description}
      </p>
    </article>
  );
}

export function HomeFeaturesSection() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-page-bg1)_0%,var(--color-page-bg2)_100%)] py-20 md:py-28"
    >
      <WaveTop fill="var(--color-page-bg1)" />
      <WaveBottom fill="var(--color-page-bg2)" />

      <FloatingOrbs
        items={[
          {
            className:
              "-right-20 -top-20 h-72 w-72 bg-[radial-gradient(circle,var(--color-brand-teal-ghost)_0%,transparent_65%)] opacity-80",
            x: [0, -8, 3, 0],
            y: [0, 18, -6, 0],
            duration: 13,
            delay: 0,
          },
          {
            className:
              "bottom-10 left-10 h-48 w-48 bg-[radial-gradient(circle,var(--color-page-bg1)_0%,transparent_70%)] opacity-90",
            x: [0, 8, -3, 0],
            y: [0, -16, 6, 0],
            duration: 10,
            delay: 1,
          },
          {
            className:
              "right-1/3 top-1/2 h-28 w-28 border-2 border-brand-teal-pale opacity-30",
            x: [0, -4, 2, 0],
            y: [0, -12, 4, 0],
            duration: 8,
            delay: 2,
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <SectionIntro
            badge="Fitur Unggulan"
            accent="TemanTumbuh"
            title="'s Fitur"
            description="Semua yang kamu butuhkan untuk memahami diri sendiri dan tumbuh lebih baik setiap harinya."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {homeFeatureItems.map((item, index) => (
            <ScrollReveal key={item.title} delay={index * 0.08}>
              <HomeFeatureCard
                iconSrc={item.iconSrc}
                title={item.title}
                description={item.description}
                badge={item.badge}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
