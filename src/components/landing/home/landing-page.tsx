// ============================================================
// src/components/landing/home/landing-page.tsx
// Composes landing home from modular section components
// ============================================================

import { HomeCtaSection } from "@/components/landing/home/sections/cta-section";
import { HomeFeaturesSection } from "@/components/landing/home/sections/features-section";
import { HomeHeroSection } from "@/components/landing/home/sections/hero-section";
import { HomeHowSection } from "@/components/landing/home/sections/how-section";
import { HomePurposeSection } from "@/components/landing/home/sections/purpose-section";
import { HomeTestimonialsSection } from "@/components/landing/home/sections/testimonials-section";

export default function LandingPage() {
  return (
    <main className="bg-page-bg0 font-sans">
      <HomeHeroSection />
      <HomeFeaturesSection />
      <HomeHowSection />
      <HomePurposeSection />
      <HomeTestimonialsSection />
      <HomeCtaSection />
    </main>
  );
}
