import { AboutCtaSection } from "@/components/landing/about/cta-section";
import { AboutHeroSection } from "@/components/landing/about/hero-section";
import { AboutMissionSection } from "@/components/landing/about/mission-section";
import { AboutScrollTop } from "@/components/landing/about/about-scroll-top";
import { AboutSdgSection } from "@/components/landing/about/sdg-section";
import { AboutTeamSection } from "@/components/landing/about/team-section";

export default function AboutPage() {
  return (
    <div>
      <AboutScrollTop />
      <AboutHeroSection />
      <AboutMissionSection />
      <AboutSdgSection />
      <AboutTeamSection />
      <AboutCtaSection />
    </div>
  );
}
