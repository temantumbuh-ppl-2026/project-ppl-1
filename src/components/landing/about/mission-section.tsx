import Image from "next/image";
import { BookOpen, Lightbulb, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

import { aboutImages, missions } from "./about-data";
import { IconCard, SectionHeader } from "./about-primitives";

const missionIcons = {
  lightbulb: Lightbulb,
  book: BookOpen,
  shield: Shield,
};

export function AboutMissionSection() {
  return (
    <section className="bg-[linear-gradient(180deg,var(--color-page-bg0)_0%,var(--color-page-bg1)_100%)] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <ScrollReveal>
          <SectionHeader
            title="Misi & Nilai TemanTumbuh"
            description="Tiga pilar yang menjadi fondasi setiap fitur dan keputusan desain platform kami."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {missions.map((mission, index) => (
            <ScrollReveal
              key={mission.title}
              delay={index * 0.08}
              className="h-full"
            >
              <IconCard
                icon={missionIcons[mission.icon]}
                title={mission.title}
                desc={mission.desc}
              />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.14}>
          <Card className="mt-14 overflow-hidden">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
              <CardContent className="z-10 flex flex-col justify-center space-y-6 p-10 lg:p-14">
                <Badge className="w-fit rounded-full bg-brand-teal-ghost px-4 py-1.5 text-brand-teal-dark hover:bg-brand-teal-ghost">
                  VISI KAMI
                </Badge>
                <h3 className="text-3xl leading-tight font-bold text-text-brand-primary">
                  Setiap Remaja Berhak Tumbuh dengan Aman dan Percaya Diri
                </h3>
                <p className="text-sm leading-relaxed text-text-brand-secondary">
                  TemanTumbuh lahir dari keprihatinan terhadap meningkatnya
                  kekerasan emosional dan sosial pada remaja Indonesia. Kami
                  percaya teknologi yang dirancang dengan tepat dapat menjadi
                  teman setia dalam proses tumbuh kembang.
                </p>
              </CardContent>
              <div className="relative min-h-72 overflow-hidden">
                <Image
                  src={aboutImages.youth}
                  alt="Youth wellbeing"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-[center_30%]"
                  unoptimized
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.52)_100%)] lg:bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.88)_15%,rgba(255,255,255,0.48)_30%,rgba(255,255,255,0)_50%)]" />
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}
