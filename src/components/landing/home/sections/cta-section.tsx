import Link from "next/link";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FloatingOrbs } from "@/components/landing/home/reused/floating-orbs";
import { WaveTop } from "@/components/landing/home/reused/wave-divider";

export function HomeCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_60%,var(--color-brand-teal-light)_100%)] py-20 md:py-24">
      <WaveTop fill="var(--color-brand-teal-mid)" />

      <FloatingOrbs
        items={[
          {
            className:
              "-right-20 -top-20 h-80 w-80 bg-[radial-gradient(circle,rgba(255,255,255,0.3)_0%,transparent_68%)] opacity-20",
            x: [0, -16, 6, 0],
            y: [0, 24, -8, 0],
            duration: 14,
            delay: 0,
          },
          {
            className:
              "-bottom-20 -left-20 h-72 w-72 bg-[radial-gradient(circle,rgba(255,255,255,0.25)_0%,transparent_68%)] opacity-15",
            x: [0, 14, 0, 0],
            y: [0, -20, 0, 0],
            duration: 11,
            delay: 1.5,
          },
        ]}
      />

      <div className="relative mx-auto w-full max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <h2 className="mb-4 text-2xl font-bold text-white md:text-4xl">
              Siap Mulai Perjalananmu?
            </h2>

            <p className="mb-8 text-sm leading-relaxed text-white/90 md:text-base">
              Bergabunglah dengan pengguna TemanTumbuh dan mulai refleksi
              harianmu.
            </p>

            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-brand-teal transition-all hover:bg-page-bg1 active:scale-[0.97]"
            >
              Mulai Diary Sekarang
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
