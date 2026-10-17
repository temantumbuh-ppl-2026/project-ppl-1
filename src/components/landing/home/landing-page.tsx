// ============================================================
// src/components/landing/home/landing-page.tsx
// Composes landing home from modular section components
// Styling ter-scope di .tt-landing (landing-redesign.css)
// ============================================================

import "./landing-redesign.css";

import { HomeCtaSection } from "@/components/landing/home/sections/cta-section";
import { HomeFeaturesSection } from "@/components/landing/home/sections/features-section";
import { HomeHeroSection } from "@/components/landing/home/sections/hero-section";
import { HomeHowSection } from "@/components/landing/home/sections/how-section";
import { HomeMarqueeSection } from "@/components/landing/home/sections/marquee-section";
import { HomePurposeSection } from "@/components/landing/home/sections/purpose-section";
import { HomeTestimonialsSection } from "@/components/landing/home/sections/testimonials-section";

export default function LandingPage() {
  return (
    <main className="tt-landing">
      <HomeHeroSection />
      <HomeMarqueeSection />
      <HomeFeaturesSection />
      <HomeHowSection />
      <HomePurposeSection />
      <HomeTestimonialsSection />
      <HomeCtaSection />
    </main>
  );
}
