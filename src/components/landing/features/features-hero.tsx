"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";

import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";

export function FeaturesHero() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,var(--color-page-bg0)_0%,var(--color-page-bg1)_100%)] py-24">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -left-20 w-96 h-96 rounded-full bg-teal-600/5 blur-3xl border border-white/20" />
        <div className="absolute top-48 -right-20 w-80 h-80 rounded-full bg-page-bg10/5 blur-3xl border border-white/20" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="space-y-8 text-center lg:text-left">
          <ScrollReveal>
            <h1 className="text-4xl leading-tight font-extrabold text-text-brand-primary md:text-5xl">
              Ekosistem Lengkap
              <br className="hidden lg:block" />
              <span className="text-brand-teal"> Keamanan Emosional</span>
              <br className="hidden lg:block" />
              Anda
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <p className="mx-auto max-w-lg text-base leading-relaxed text-text-brand-secondary md:text-lg lg:mx-0">
              Dari diary harian yang didampingi AI, pilihan emosional yang
              melatih keberanian, hingga pemantauan mood visual - semua dalam
              satu platform yang aman dan terpercaya.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.14}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_100%)] px-8 font-bold text-white hover:opacity-90 sm:w-auto"
                >
                  Mulai Sesi Gratis <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full rounded-xl border-2 bg-white px-8 font-bold text-brand-teal-dark hover:bg-page-bg1 hover:text-brand-teal-dark sm:w-auto"
                >
                  Lihat Harga
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.12}>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-brand-border shadow-[0_10px_32px_rgba(26,40,64,0.12)]">
            <Image
              src="https://images.unsplash.com/photo-1622997074056-9e652a0cf5bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxJbmRvbmVzaWFuJTIwdGVlbmFnZSUyMHN0dWRlbnRzJTIwdXNpbmclMjBwaG9uZSUyMGxhcHRvcCUyMHN0dWR5aW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzc1MDQwOTg3fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="TemanTumbuh youth using app"
              fill
              className="object-cover object-center"
              unoptimized
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(17,52,50,0.65)_100%)]" />

            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur-md">
              <div className="h-2.5 w-2.5 rounded-full bg-brand-teal-light shadow-[0_0_0_4px_#D1FAE5]" />
              <p className="flex-1 text-xs font-bold text-text-brand-primary">
                Buddy sedang mendengar Anda...
              </p>
              <div className="flex h-4 items-end gap-1">
                <div className="h-1 w-1 animate-pulse rounded-full bg-brand-teal" />
                <div
                  className="h-2 w-1 animate-pulse rounded-full bg-brand-teal"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="h-3 w-1 animate-pulse rounded-full bg-brand-teal"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
