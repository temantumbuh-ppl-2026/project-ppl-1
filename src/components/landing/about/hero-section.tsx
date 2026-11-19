import Image from "next/image";
import Link from "next/link";
import { GraduationCap, Heart, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

import { aboutImages } from "./about-data";

export function AboutHeroSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-page-bg0)_0%,var(--color-page-bg1)_100%)] py-24">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left — Text */}
        <div className="space-y-8">
          <ScrollReveal>
            <h1 className="text-4xl leading-tight font-extrabold text-text-brand-primary md:text-5xl">
              Mewujudkan <span className="text-brand-teal">Ruang Digital</span>{" "}
              yang Aman bagi{" "}
              <span className="text-brand-teal">Generasi Muda</span>.
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <p className="text-base leading-relaxed text-text-brand-secondary md:text-lg">
              TemanTumbuh adalah platform refleksi diri dan keamanan emosional
              berbasis digital untuk remaja Indonesia. Kami menyediakan ruang
              aman untuk mengenali emosi, membangun kesadaran diri, dan tumbuh
              bersama dukungan orang terpercaya.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.14}>
            <div className="flex flex-wrap items-center gap-3 pb-1 md:gap-4">
              {[
                { icon: Shield, label: "Privasi Terlindungi" },
                { icon: GraduationCap, label: "Berbasis Riset Akademik" },
                { icon: Heart, label: "Berorientasi Dampak Sosial" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex shrink-0 items-center gap-1.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-brand-teal md:h-4 md:w-4" />
                  </span>
                  <span className="text-xs font-semibold text-text-brand-primary lg:text-xs">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="h-12 rounded-xl bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_100%)] px-8 text-white hover:opacity-90"
              >
                <Link href="/register">Mulai Sekarang</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-2 bg-white px-8 text-brand-teal-dark hover:bg-page-bg1 hover:text-brand-teal-dark"
              >
                <a href="#team">Kenali Tim Kami</a>
              </Button>
            </div>
          </ScrollReveal>
        </div>

        {/* Right — Image */}
        <ScrollReveal delay={0.12}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-brand-border shadow-[0_10px_32px_rgba(26,40,64,0.12)]">
            <Image
              src={aboutImages.hero}
              alt="University students supportive environment"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-center"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(17,52,50,0.65)_100%)]" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="text-sm font-semibold text-white">
                Kelompok Cegukan · Teknik Informatika
              </p>
              <p className="mt-0.5 text-xs text-white/80">
                Universitas Padjadjaran
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
