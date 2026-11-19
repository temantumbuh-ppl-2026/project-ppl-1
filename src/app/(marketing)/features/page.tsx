import { Metadata } from "next";
import { FeaturesHero } from "@/components/landing/features/features-hero";
import {
  FeaturesDiary,
  FeaturesBraveChoice,
  FeaturesMood,
  FeaturesInsight,
  FeaturesQuote,
  FeaturesPrivacy,
  FeaturesCTA,
} from "@/components/landing/features/features-sections";

export const metadata: Metadata = {
  title: "Fitur TemanTumbuh",
  description: "Ekosistem Lengkap Keamanan Emosional Kamu",
};

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-hidden font-sans">
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
