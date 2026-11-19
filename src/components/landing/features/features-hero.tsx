import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MoodFaceIcon } from "@/components/mood/mood-face-icons";
import { DoodleArrow } from "@/components/landing/home/reused/doodles";

import { heroInsightBars } from "./features-data";

const featureChips = [
  { href: "#temancerita", number: "01", label: "TemanCerita" },
  { href: "#brave-choice", number: "02", label: "Brave Choice" },
  { href: "#mood-checkin", number: "03", label: "Mood Check-in" },
  { href: "#insight", number: "04", label: "Insight" },
] as const;

function FeatureHeroPreview() {
  return (
    <div
      className="feature-hero-preview"
      role="img"
      aria-label="Ilustrasi tampilan TemanCerita, Mood Check-in, dan Insight"
    >
      <div className="preview-shape preview-shape-mint" />
      <div className="preview-shape preview-shape-yellow" />
      <div className="hero-chat-card" aria-hidden="true">
        <span className="demo-label">TemanCerita</span>
        <div className="mini-chat buddy">Hai, bagaimana harimu?</div>
        <div className="mini-chat user">
          Sedikit cemas, tapi aku mau cerita.
        </div>
        <div className="mini-input">
          Tulis ceritamu... <b>→</b>
        </div>
      </div>
      <div className="hero-mood-card" aria-hidden="true">
        <span>Mood hari ini</span>
        <div>
          {([2, 3, 4, 5] as const).map((score) => (
            <b className={score === 4 ? "selected" : ""} key={score}>
              <MoodFaceIcon score={score} size={26} active={score === 4} />
            </b>
          ))}
        </div>
        <small>Senang · dipilih</small>
      </div>
      <div className="hero-insight-card" aria-hidden="true">
        <span>Contoh insight minggu ini</span>
        <div className="mini-bars">
          {heroInsightBars.map((height, index) => (
            <i key={index} style={{ height: `${height}%` }} />
          ))}
        </div>
        <small>Ilustrasi pola mood harian</small>
      </div>
      <span className="preview-sticker">semua terasa lebih jelas</span>
      <DoodleArrow className="feature-hero-arrow" />
    </div>
  );
}

export function FeaturesHero() {
  return (
    <section className="feature-hero">
      <div className="shell feature-hero-grid">
        <div className="feature-hero-copy">
          <div className="eyebrow">
            <span /> Fitur TemanTumbuh
          </div>
          <h1>
            Kenali perasaanmu.
            <br />
            Temukan ruang untuk <em>tumbuh.</em>
          </h1>
          <p>
            Dari cerita harian hingga memahami pola emosi, kenali fitur
            TemanTumbuh yang menemani langkah kecilmu setiap hari.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/register">
              Mulai Bercerita <ArrowRight className="icon" size={19} />
            </Link>
            <Link className="text-link" href="#daftar-fitur">
              Jelajahi Fitur <span>↓</span>
            </Link>
          </div>
        </div>
        <FeatureHeroPreview />
      </div>
      <nav className="shell feature-chips" aria-label="Navigasi fitur">
        {featureChips.map((chip) => (
          <Link href={chip.href} key={chip.href}>
            <span>{chip.number}</span> {chip.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
