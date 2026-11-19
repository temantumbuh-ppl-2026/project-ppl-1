import { Metadata } from "next";
import {
  PricingContent,
  PricingBackground,
} from "@/components/landing/pricing/pricing-sections";

export const metadata: Metadata = {
  title: "Paket Berlangganan | TemanTumbuh",
  description:
    "Mulai gratis, upgrade kapan saja. Semua paket mencakup keamanan data dan privasi penuh.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen relative overflow-x-hidden font-sans pt-12 text-teal-950 pb-20">
      <PricingBackground />
      <PricingContent />
    </main>
  );
}
