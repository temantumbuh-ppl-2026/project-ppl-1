import Link from "next/link";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import {
  ClosingStar,
  DoodleArrow,
  HeroStar,
} from "@/components/landing/home/reused/doodles";

import { PlanActions } from "./pricing-actions";
import { basicPlan, pricingFaqs, singlePlan } from "./pricing-data";
import { PricingFaqList } from "./pricing-faq";

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="plan-features">
      {items.map((item) => (
        <li key={item}>
          <span>
            <Check className="icon" size={12} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function PricingHero() {
  return (
    <section className="pricing-hero">
      <div className="shell">
        <div className="pricing-heading">
          <div className="eyebrow">
            <span /> Langganan TemanTumbuh
          </div>
          <h1>
            Pilih ruang <em>tumbuh</em>
            <br />
            yang cocok untukmu.
          </h1>
          <p>Mulai gratis, upgrade kapan saja.</p>
          <svg
            className="pricing-squiggle"
            viewBox="0 0 170 35"
            aria-hidden="true"
          >
            <path d="M3 21c21-14 37 12 57-2s38 10 58-2 31-5 48 1" />
          </svg>
        </div>

        <div
          className="pricing-grid"
          role="group"
          aria-label="Perbandingan paket TemanTumbuh"
        >
          <article className="pricing-card basic-card">
            <div className="plan-badge">
              <span /> {basicPlan.badge}
            </div>
            <h2>{basicPlan.name}</h2>
            <div className="plan-price">
              <strong>{basicPlan.price}</strong>
              <span>{basicPlan.priceUnit}</span>
            </div>
            <span className="plan-period">{basicPlan.period}</span>
            <p className="plan-description">{basicPlan.description}</p>
            <div className="plan-divider" />
            <span className="plan-list-label">Yang kamu dapatkan</span>
            <FeatureList items={basicPlan.features} />
            <div className="single-only">
              {basicPlan.singleOnly.map((item) => (
                <p key={item}>
                  <Sparkles className="icon" size={16} />
                  <span>
                    <strong>{item}</strong>Tersedia di {singlePlan.name}
                  </span>
                </p>
              ))}
            </div>
            <PlanActions plan="basic" />
          </article>

          <article className="pricing-card single-card">
            <HeroStar className="plan-star" />
            <div className="plan-badge">
              <Sparkles className="icon" size={13} /> {singlePlan.badge}
            </div>
            <h2>{singlePlan.name}</h2>
            <div className="plan-price">
              <strong>{singlePlan.price}</strong>
              <span>{singlePlan.priceUnit}</span>
            </div>
            <span className="plan-period">{singlePlan.period}</span>
            <p className="plan-description">{singlePlan.description}</p>
            <div className="plan-divider" />
            <span className="plan-list-label">
              Semua fitur {basicPlan.name}, ditambah:
            </span>
            <FeatureList items={singlePlan.features} />
            <PlanActions plan="single" />
          </article>
        </div>
      </div>
    </section>
  );
}

export function PricingFaqSection() {
  return (
    <section className="pricing-faq section" id="faq">
      <div className="shell faq-layout">
        <div className="faq-heading">
          <span className="handwritten">sebelum kamu memilih</span>
          <h2>
            Pertanyaan
            <br />
            <em>umum.</em>
          </h2>
          <p>Semua yang perlu kamu ketahui tentang paket kami.</p>
        </div>
        <PricingFaqList faqs={pricingFaqs} />
      </div>
    </section>
  );
}

export function PricingClosing() {
  return (
    <section className="closing pricing-closing">
      <div className="shell closing-inner">
        <ClosingStar />
        <span className="handwritten">satu langkah kecil</span>
        <h2>
          Siap Memulai
          <br />
          Perjalananmu?
        </h2>
        <p>Bergabung dengan ruang aman yang dipercaya untuk tumbuh.</p>
        <Link className="button button-light" href="/register">
          Mulai Sekarang <ArrowRight className="icon" size={19} />
        </Link>
        <DoodleArrow className="closing-arrow" />
      </div>
    </section>
  );
}
