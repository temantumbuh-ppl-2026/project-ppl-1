import Image from "next/image";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

import { SectionHeader } from "./about-primitives";

const commitmentCards = [
  {
    pillar: "PILAR 01",
    title: "Deteksi Dini yang Tetap Menjaga Privasi",
    description:
      "Sistem membaca sinyal risiko dari jurnal harian tanpa mengekspose isi personal ke pihak lain.",
  },
  {
    pillar: "PILAR 02",
    title: "Edukasi Keputusan Aman",
    description:
      "Skenario interaktif melatih respons remaja pada tekanan sosial, manipulasi, dan relasi tidak sehat.",
  },
  {
    pillar: "PILAR 03",
    title: "Dukungan Keluarga yang Seimbang",
    description:
      "Orang tua menerima ringkasan perkembangan tanpa akses ke isi diary, sehingga kepercayaan remaja tetap terjaga.",
  },
  {
    pillar: "PILAR 04",
    title: "Perbaikan Berbasis Data",
    description:
      "Setiap fitur dievaluasi berkala agar dampak perlindungan emosional tetap relevan dan terukur dari waktu ke waktu.",
  },
] as const;

const sdgIndicators = [
  {
    code: "16.2.1",
    text: "Proportion of children aged 1-17 years who experienced any physical punishment and/or psychological aggression by caregivers in the past month",
  },
  {
    code: "16.2.2",
    text: "Number of victims of human trafficking per 100,000 population, by sex, age and form of exploitation",
  },
  {
    code: "16.2.3",
    text: "Proportion of young women and men aged 18-29 years who experienced sexual violence by age 18",
  },
] as const;

export function AboutSdgSection() {
  return (
    <section className="bg-[linear-gradient(180deg,var(--color-page-bg1)_0%,var(--color-page-bg0)_100%)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <SectionHeader
            title="Komitmen Kami Terhadap SDG 16.2"
            description="Kami menerjemahkan prinsip perlindungan anak ke fitur produk yang aman, terukur, dan relevan dengan konteks remaja Indonesia."
          />
        </ScrollReveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <ScrollReveal delay={0.04} className="h-full">
            <Card className="h-full border-brand-border bg-card shadow-[0_10px_30px_rgba(26,40,64,0.10)]">
              <CardContent className="flex h-full flex-col gap-5 p-6 sm:p-7">
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
                  <div className="relative mx-auto h-20 w-20 shrink-0 sm:h-22 sm:w-22">
                    <Image
                      src="/img/sgds16.png"
                      alt="SDG 16"
                      fill
                      sizes="112px"
                      className="object-contain"
                    />
                  </div>
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-sm font-extrabold tracking-wide text-brand-teal-dark">
                      SDG 16.2
                    </p>
                    <p className="text-sm font-semibold text-text-brand-secondary">
                      End abuse, exploitation, trafficking and violence against
                      children
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-xl text-text-brand-primary">
                    Fokus Utama TemanTumbuh
                  </CardTitle>
                  <p className="text-sm leading-relaxed text-text-brand-secondary">
                    Menurunkan risiko kekerasan emosional melalui intervensi
                    preventif, edukasi keputusan aman, dan dukungan keluarga
                    yang tetap menghormati privasi remaja.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-bold uppercase tracking-wider text-text-brand-primary">
                    Indikator SDG 16.2
                  </p>
                  <ul className="space-y-2">
                    {sdgIndicators.map((indicator) => (
                      <li
                        key={indicator.code}
                        className="grid grid-cols-[auto_1fr] gap-3 border-b border-brand-border/70 pb-4 last:border-b-0 last:pb-0"
                      >
                        <span className="text-sm font-bold text-brand-teal-dark">
                          {indicator.code}
                        </span>
                        <span className="text-sm text-text-brand-secondary">
                          {indicator.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </ScrollReveal>

          <div className="grid auto-rows-fr gap-6 sm:grid-cols-2">
            {commitmentCards.map((item, index) => (
              <ScrollReveal
                key={item.title}
                delay={0.08 + index * 0.05}
                className="h-full"
              >
                <Card className="h-full border-brand-border bg-card shadow-[0_10px_28px_rgba(26,40,64,0.08)]">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <p className="text-xs font-semibold uppercase tracking-widest text-brand-teal">
                      {item.pillar}
                    </p>
                    <CardTitle className="text-lg text-text-brand-primary">
                      {item.title}
                    </CardTitle>
                    <p className="flex-1 text-sm leading-relaxed text-text-brand-secondary">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
