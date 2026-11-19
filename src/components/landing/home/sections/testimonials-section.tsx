import { homeTestimonialItems } from "@/components/landing/home/home-content";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { FloatingOrbs } from "@/components/landing/home/reused/floating-orbs";
import { SectionIntro } from "@/components/landing/home/reused/section-intro";
import {
  WaveBottom,
  WaveTop,
} from "@/components/landing/home/reused/wave-divider";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function HomeTestimonialCard({
  name,
  role,
  quote,
}: {
  name: string;
  role: string;
  quote: string;
}) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-brand-border bg-white p-6 shadow-[0_2px_16px_rgba(26,40,64,0.07)] transition-transform duration-200 hover:-translate-y-1">
      <span className="text-5xl font-bold leading-none text-brand-teal-pale">
        &ldquo;
      </span>

      <p className="flex-1 text-sm leading-relaxed italic text-text-brand-secondary">
        {quote}
      </p>

      <div className="flex items-center gap-3 border-t border-brand-border pt-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-teal-ghost text-xs font-bold text-brand-teal">
          {getInitials(name)}
        </div>

        <div>
          <p className="text-xs font-semibold text-text-brand-primary">
            {name}
          </p>
          <p className="text-xs text-text-brand-muted">{role}</p>
        </div>
      </div>
    </article>
  );
}

export function HomeTestimonialsSection() {
  return (
    <section
      id="testi"
      className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-page-bg5)_0%,var(--color-page-bg6)_100%)] py-20 md:py-28"
    >
      <WaveTop fill="var(--color-page-bg5)" />
      <WaveBottom fill="var(--color-brand-teal-mid)" />

      <FloatingOrbs
        items={[
          {
            className:
              "right-8 top-8 h-64 w-64 bg-[radial-gradient(circle,var(--color-brand-teal-ghost)_0%,transparent_62%)] opacity-80",
            x: [0, 12, 0],
            y: [0, -22, 8, 0],
            duration: 11,
            delay: 0,
          },
          {
            className:
              "bottom-8 left-8 h-48 w-48 bg-[radial-gradient(circle,var(--color-page-bg6)_0%,transparent_65%)] opacity-85",
            x: [0, 0, 0],
            y: [0, 20, 0],
            duration: 8,
            delay: 2.5,
          },
          {
            className:
              "left-1/3 top-1/3 h-32 w-32 border-2 border-brand-teal-pale opacity-35",
            x: [0, -12, 6, 0],
            y: [0, 16, -8, 0],
            duration: 14,
            delay: 4,
          },
        ]}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <SectionIntro
            badge="Testimoni"
            title="Apa Kata Mereka?"
            description="Ribuan pengguna telah merasakan manfaat nyata bersama TemanTumbuh."
          />
        </ScrollReveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {homeTestimonialItems.map((item, index) => (
            <ScrollReveal key={item.name} delay={index * 0.1}>
              <HomeTestimonialCard
                name={item.name}
                role={item.role}
                quote={item.quote}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
