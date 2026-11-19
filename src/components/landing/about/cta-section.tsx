import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

export function AboutCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_62%,var(--color-brand-teal-light)_100%)] py-24 text-white">
      <div className="pointer-events-none absolute -left-24 -top-48 h-136 w-136 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-24 -right-12 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <div className="space-y-8">
            <h2 className="text-4xl leading-tight font-bold md:text-5xl">
              Mari Tumbuh Bersama.
              <br />
              Mulai Perjalananmu Sekarang.
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/85">
              Bergabunglah dengan ribuan remaja yang sudah merasakan manfaat
              TemanTumbuh. Gratis selamanya untuk fitur dasar, karena kesehatan
              emosional adalah hak setiap generasi muda.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                variant="secondary"
                className="h-14 rounded-2xl bg-white px-10 font-bold text-brand-teal-dark shadow-lg transition-all hover:bg-white/85"
              >
                <Link href="/register">Daftar Gratis Sekarang</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 rounded-2xl border-white/30 bg-transparent px-10 font-bold text-white transition-all hover:bg-white/5 hover:text-white"
              >
                <Link href="/">Lihat Platform</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
