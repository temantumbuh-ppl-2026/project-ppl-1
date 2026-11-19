"use client";

import Link from "next/link";
import { CheckCircle2, Star, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/landing/about/about-primitives";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { useEffect } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Bagaimana sistem pembayarannya?",
    a: "Pembayaran dilakukan di awal untuk langsung mengakses semua fitur Single Premium tanpa batasan. Kamu bisa membatalkan langganan kapan saja.",
  },
  {
    q: "Apakah isi diary saya aman dan privat?",
    a: "Sepenuhnya. Semua isi diary dienkripsi end-to-end dan tidak dapat diakses oleh siapapun, termasuk tim TemanTumbuh. Orang tua hanya menerima laporan umum non-personal.",
  },
  {
    q: "Bisakah saya upgrade atau downgrade kapan saja?",
    a: "Tentu! Kamu bisa upgrade ke Single Premium kapan saja, dan downgrade kembali ke Basic di akhir periode berlangganan tanpa penalti apapun.",
  },
  {
    q: "Metode pembayaran apa yang tersedia?",
    a: "Kami menerima GoPay, OVO, QRIS, VISA, Mastercard, dan transfer bank BCA melalui Midtrans — gateway pembayaran terpercaya di Indonesia.",
  },
];

function PRow({
  text,
  on = true,
  premium = false,
  highlight = false,
}: {
  text: string;
  on?: boolean;
  premium?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-4 py-2 border-b ${on ? "border-brand-border/50" : "border-transparent"}`}
    >
      <div className="shrink-0 mt-0.5">
        {on ? (
          <CheckCircle2
            className={`w-[18px] h-[18px] transition-colors ${premium ? "text-brand-teal-dark" : "text-brand-teal"}`}
          />
        ) : (
          <XIcon className="w-[18px] h-[18px] text-teal-200" />
        )}
      </div>
      <p
        className={`text-sm transition-colors ${
          on
            ? highlight
              ? "text-text-brand-primary font-semibold"
              : "text-brand-teal-dark"
            : "text-[#89a0a6] line-through decoration-teal-200"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

export function PricingContent() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const price = 59000;

  return (
    <div className="relative z-10 w-full mx-auto pb-8 lg:pb-16 mt-4">
      {/* ── HEADER ── */}
      <section className="bg-transparent pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center text-center">
          <ScrollReveal>
            <SectionHeader
              title="Pilih Paket Pertumbuhanmu"
              description="Mulai gratis, upgrade kapan saja."
            />
          </ScrollReveal>

          {/* TWO PLAN CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-8 text-left">
            {/* BASIC */}
            <ScrollReveal delay={0.1}>
              <div className="flex flex-col h-full rounded-2xl bg-white border border-brand-border p-8 lg:p-10 shadow-[0_10px_32px_rgba(26,40,64,0.12)]">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-page-bg1 border border-brand-border mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">
                      Starter
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-text-brand-primary mb-2">
                    Basic
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-text-brand-primary">
                      Rp 0
                    </span>
                    <span className="text-base font-medium text-text-brand-secondary">
                      / Selamanya
                    </span>
                  </div>
                </div>

                <div className="flex-1 mb-10">
                  <p className="text-[10px] font-extrabold tracking-widest uppercase text-[#89a0a6] mb-4">
                    YANG KAMU DAPATKAN
                  </p>
                  <PRow text="15 Sesi Diary per Bulan" on />
                  <PRow text="Mood Tracking Harian" on />
                  <PRow text="Laporan Email ke Orang Tua" on />
                  <PRow text="Akses Brave Choice Trivia (5/hari)" on />
                  <div className="h-px bg-brand-border/60 my-4" />
                  <PRow text="Insight Dashboard" on={false} />
                  <PRow text="Rekomendasi Aksi Nyata" on={false} />
                </div>

                <div className="mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-14 rounded-xl border-2 bg-white border-brand-teal text-brand-teal-dark hover:bg-page-bg1 hover:text-brand-teal-dark font-bold text-base"
                    asChild
                  >
                    <Link href="/register">Gunakan Gratis</Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>

            {/* SINGLE PREMIUM */}
            <ScrollReveal delay={0.2}>
              <div className="flex flex-col h-full rounded-2xl bg-page-bg1 border border-brand-border p-8 lg:p-10 shadow-[0_10px_32px_rgba(26,40,64,0.12)] relative overflow-hidden group">
                {/* Glowing borders/accents */}
                <div className="absolute inset-0 border border-teal-300 pointer-events-none rounded-2xl" />
                <div className="absolute -top-32 -right-16 w-64 h-64 rounded-full bg-teal-700/5 blur-3xl pointer-events-none" />

                <div className="relative z-10 mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal text-white mb-4 shadow-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      PALING DIREKOMENDASIKAN
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-text-brand-primary mb-2">
                    Single
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-text-brand-primary">
                      Rp {price.toLocaleString("id-ID")}
                    </span>
                    <span className="text-base font-medium text-text-brand-secondary">
                      / Bulan
                    </span>
                  </div>
                </div>

                <div className="flex-1 relative z-10 mb-10">
                  <p className="text-[10px] font-extrabold tracking-widest uppercase text-brand-teal-dark mb-4">
                    SEMUA DI BASIC, PLUS:
                  </p>
                  <PRow text="Unlimited Sesi Diary" on premium highlight />
                  <PRow text="Insight Dashboard" on premium highlight />
                  <PRow text="Rekomendasi Aksi Nyata" on premium highlight />
                  <div className="h-px bg-teal-200/60 my-4" />
                  <PRow text="Brave Choice Unlimited" on premium />
                  <PRow text="Analisis Tren Emosi Bulanan" on premium />
                  <PRow text="Export Data Lengkap" on premium />
                </div>

                <div className="relative z-10 mt-8">
                  <Button
                    size="lg"
                    className="w-full h-14 rounded-xl bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_100%)] hover:opacity-90 text-white shadow-xl shadow-brand-teal/20 font-bold text-base gap-2 transition-all"
                    asChild
                  >
                    <Link href="/register?plan=single">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />{" "}
                      Pilih Paket Single
                    </Link>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── VISUAL CTA STRIP ── */}
      <ScrollReveal delay={0.1}>
        <div className="w-full px-6 lg:px-8 max-w-5xl mx-auto mb-30 relative overflow-hidden">
          <div className="rounded-2xl p-8 md:p-10 bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_100%)] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_32px_rgba(26,40,64,0.12)] relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -left-10 -bottom-20 w-80 h-80 rounded-full bg-teal-800/10 blur-3xl pointer-events-none" />
            <div className="text-center md:text-left relative z-10 w-full">
              <p className="font-extrabold text-2xl md:text-3xl text-white mb-2 tracking-tight">
                Siap Memulai Perjalanan Anda?
              </p>
              <p className="text-teal-50 text-base">
                Bergabung dengan ruang aman yang dipercaya untuk tumbuh.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full md:w-auto bg-white text-text-brand-primary hover:bg-page-bg1 font-bold h-14 px-8 rounded-xl shadow-sm relative z-10 shrink-0"
              asChild
            >
              <Link href="/register">Mulai Sekarang</Link>
            </Button>
          </div>
        </div>
      </ScrollReveal>

      {/* ── FAQ ── */}
      <ScrollReveal delay={0.2}>
        <div className="w-full max-w-5xl mx-auto px-6 lg:px-8 mb-4">
          <SectionHeader
            title="Pertanyaan Umum"
            description="Semua yang perlu Anda ketahui tentang paket kami."
          />

          <Accordion type="single" collapsible className="w-full mt-10">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-brand-border py-4"
              >
                <AccordionTrigger className="text-base font-bold text-text-brand-primary hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-text-brand-secondary pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollReveal>
    </div>
  );
}

export function PricingBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-page-bg0">
      {/* Blurred Blobs mapped to brand colors */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-teal-600/10 blur-3xl -top-32 -left-32" />
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl -bottom-32 -right-32" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-teal-300/10 blur-3xl top-1/3 right-0" />

      {/* Backdoor frosted glass */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40" />
    </div>
  );
}
