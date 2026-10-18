import "@/components/landing/home/landing-redesign.css";
import "@/components/landing/pricing/pricing-redesign.css";
import "@/components/landing/home/landing-motion.css";

import type { Metadata } from "next";

import { LandingMotion } from "@/components/landing/home/landing-motion";
import {
  PricingClosing,
  PricingFaqSection,
  PricingHero,
} from "@/components/landing/pricing/pricing-sections";

export const metadata: Metadata = {
  title: "Paket Berlangganan",
  description:
    "Mulai gratis, upgrade kapan saja. Semua paket mencakup keamanan data dan privasi penuh.",
};

export default function PricingPage() {
  return (
    <main className="tt-landing pricing-page">
      <LandingMotion />
      <PricingHero />
      <PricingFaqSection />
      <PricingClosing />
    </main>
  );
}
