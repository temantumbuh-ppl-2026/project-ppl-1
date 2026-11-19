"use client";

import { useEffect } from "react";

type RevealVariant = "up" | "left" | "right" | "zoom" | "draw";

type RevealTarget = {
  selector: string;
  variant: RevealVariant;
  /** Jeda antar elemen bersaudara (ms). */
  stagger?: number;
  /** Urutan stagger diulang tiap N elemen (mis. kolom dalam grid). */
  cycle?: number;
  /** Jeda dasar (ms). */
  delay?: number;
};

// Elemen di bawah layar diberi animasi masuk saat pertama kali terlihat.
const targets: RevealTarget[] = [
  // Landing
  { selector: ".features .section-heading > *", variant: "up", stagger: 120 },
  { selector: ".diary-feature", variant: "up" },
  { selector: ".feature-item", variant: "up", stagger: 130 },
  { selector: ".how-title > *", variant: "up", stagger: 110 },
  { selector: ".steps article", variant: "up", stagger: 160 },
  { selector: ".steps .step-arrow", variant: "draw", stagger: 300, delay: 350 },
  { selector: ".values-visual", variant: "left" },
  { selector: ".values-copy > *", variant: "up", stagger: 100 },
  { selector: ".value-list > div", variant: "up", stagger: 120 },
  { selector: ".smile-doodle", variant: "draw", delay: 500 },
  { selector: ".testimonial-heading", variant: "left" },
  { selector: ".testimonial-card", variant: "right", delay: 120 },
  { selector: ".closing-inner > :not(svg)", variant: "up", stagger: 110 },
  { selector: ".closing-arrow", variant: "draw", delay: 700 },
  // Fitur
  {
    selector: ".feature-copy > :not(.feature-big-number)",
    variant: "up",
    stagger: 100,
  },
  { selector: ".feature-split .product-demo", variant: "zoom", delay: 150 },
  {
    selector: ".feature-quote .shell > :not(svg)",
    variant: "up",
    stagger: 120,
  },
  { selector: ".feature-quote svg", variant: "draw", delay: 400 },
  { selector: ".privacy-copy > *", variant: "up", stagger: 100 },
  { selector: ".privacy-preview", variant: "right", delay: 120 },
  // Langganan
  { selector: ".faq-heading > *", variant: "up", stagger: 110 },
  { selector: ".faq-item", variant: "up", stagger: 110 },
  // About
  { selector: ".about-section-title > *", variant: "up", stagger: 110 },
  { selector: ".mission-list article", variant: "up", stagger: 140 },
  { selector: ".vision-photo-wrap", variant: "left" },
  { selector: ".vision-copy > *", variant: "up", stagger: 110 },
  { selector: ".sdg-heading > *", variant: "up", stagger: 120 },
  { selector: ".sdg-panel", variant: "left" },
  { selector: ".pillar-grid article", variant: "zoom", stagger: 110 },
  { selector: ".team-heading > *", variant: "up", stagger: 110 },
  { selector: ".team-grid article", variant: "up", stagger: 120, cycle: 3 },
];

export function LandingMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.querySelector(".tt-landing");
    if (!root) return;

    const viewportHeight = window.innerHeight;
    const pending: HTMLElement[] = [];

    for (const {
      selector,
      variant,
      stagger = 0,
      cycle,
      delay = 0,
    } of targets) {
      const seenParents = new Map<Element | null, number>();

      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        // Elemen yang sudah terlihat (atau terlewati) saat load tidak disembunyikan.
        if (element.getBoundingClientRect().top < viewportHeight * 0.92) return;

        const parent = element.parentElement;
        const index = seenParents.get(parent) ?? 0;
        seenParents.set(parent, index + 1);
        const order = cycle ? index % cycle : Math.min(index, 6);

        element.dataset.reveal = variant;
        element.style.setProperty(
          "--reveal-delay",
          `${delay + order * stagger}ms`,
        );
        pending.push(element);
      });
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealState = "in";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    pending.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      pending.forEach((element) => {
        delete element.dataset.reveal;
        delete element.dataset.revealState;
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return null;
}
