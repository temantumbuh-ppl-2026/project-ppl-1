import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { ComponentType } from "react";

import {
  aboutImages,
  aboutPrinciples,
} from "@/components/landing/about/about-data";
import {
  DoodleArrow,
  HeroStar,
} from "@/components/landing/home/reused/doodles";

const principleIcons: Record<
  (typeof aboutPrinciples)[number]["icon"],
  ComponentType<{ className?: string; size?: number }>
> = {
  shield: ShieldCheck,
  spark: Sparkles,
  people: Users,
};

export function AboutHeroSection() {
  return (
    <section className="about-hero">
      <div className="shell about-hero-grid">
        <div className="about-hero-copy">
          <div className="eyebrow">
            <span /> Tentang TemanTumbuh
          </div>
          <h1>
            Mewujudkan Ruang
            <br />
            Digital yang <em>Aman</em>
            <br />
            bagi Generasi Muda.
          </h1>
          <p>
            TemanTumbuh adalah platform refleksi diri dan keamanan emosional
            berbasis digital untuk remaja Indonesia. Kami menyediakan ruang aman
            untuk mengenali emosi, membangun kesadaran diri, dan tumbuh bersama
            dukungan orang terpercaya.
          </p>
          <div className="about-principles" aria-label="Prinsip TemanTumbuh">
            {aboutPrinciples.map(({ icon, label }) => {
              const Icon = principleIcons[icon];
              return (
                <span key={label}>
                  <Icon className="icon" size={16} /> {label}
                </span>
              );
            })}
          </div>
          <div className="hero-actions">
            <Link className="button" href="/register">
              Mulai Sekarang <ArrowRight className="icon" size={19} />
            </Link>
            <Link className="text-link" href="#team">
              Kenali Tim Kami <span>↓</span>
            </Link>
          </div>
        </div>
        <div className="about-collage">
          <div className="about-shape about-shape-mint" />
          <div className="about-shape about-shape-yellow" />
          <figure className="about-main-photo">
            <Image
              src={aboutImages.hero}
              alt="Pelajar saling mendukung di lingkungan kampus"
              fill
              priority
              sizes="(max-width: 980px) 90vw, 540px"
            />
          </figure>
          <span className="about-photo-note">
            ruang aman dimulai
            <br />
            dari rasa percaya
          </span>
          <HeroStar className="about-spark" />
          <DoodleArrow className="about-hero-arrow" />
        </div>
      </div>
    </section>
  );
}
