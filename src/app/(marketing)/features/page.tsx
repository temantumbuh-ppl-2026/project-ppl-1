import "@/components/landing/home/landing-redesign.css";
import "@/components/landing/features/features-redesign.css";
import "@/components/landing/home/landing-motion.css";

import type { Metadata } from "next";

import { FeaturesHero } from "@/components/landing/features/features-hero";
import {
  FeaturesBraveChoice,
  FeaturesCTA,
  FeaturesDiary,
  FeaturesInsight,
  FeaturesMood,
  FeaturesPrivacy,
  FeaturesQuote,
} from "@/components/landing/features/features-sections";
import { LandingMotion } from "@/components/landing/home/landing-motion";

export const metadata: Metadata = {
  title: "Fitur TemanTumbuh",
  description:
    "Kenali TemanCerita, Brave Choice, Mood Check-in, dan Insight Dashboard yang menemani langkah kecilmu setiap hari.",
};

export default function FeaturesPage() {
  return (
    <main className="tt-landing features-page">
      <LandingMotion />
      <FeaturesHero />
      <FeaturesDiary />
      <FeaturesBraveChoice />
      <FeaturesMood />
      <FeaturesInsight />
      <FeaturesQuote />
      <FeaturesPrivacy />
      <FeaturesCTA />
    </main>
  );
}
