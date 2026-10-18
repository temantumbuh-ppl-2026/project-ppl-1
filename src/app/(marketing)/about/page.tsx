import "@/components/landing/home/landing-redesign.css";
import "@/components/landing/about/about-redesign.css";
import "@/components/landing/home/landing-motion.css";

import { LandingMotion } from "@/components/landing/home/landing-motion";
import { AboutCtaSection } from "@/components/landing/about/cta-section";
import { AboutHeroSection } from "@/components/landing/about/hero-section";
import { AboutMissionSection } from "@/components/landing/about/mission-section";
import { AboutScrollTop } from "@/components/landing/about/about-scroll-top";
import { AboutSdgSection } from "@/components/landing/about/sdg-section";
import { AboutTeamSection } from "@/components/landing/about/team-section";
import { AboutVisionSection } from "@/components/landing/about/vision-section";

export default function AboutPage() {
  return (
    <main className="tt-landing about-page">
      <AboutScrollTop />
      <LandingMotion />
      <AboutHeroSection />
      <AboutMissionSection />
      <AboutVisionSection />
      <AboutSdgSection />
      <AboutTeamSection />
      <AboutCtaSection />
    </main>
  );
}
