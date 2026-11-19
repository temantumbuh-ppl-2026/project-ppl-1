"use client";

import { useId, useState } from "react";

import { sdgIndicators } from "@/components/landing/about/about-data";

export function SdgIndicatorAccordion() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`sdg-accordion${open ? " open" : ""}`}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="sdg-accordion-toggle"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        Pelajari indikator SDG 16.2
        <span className="sdg-accordion-icon" aria-hidden="true" />
      </button>
      <div
        aria-hidden={!open}
        className="sdg-accordion-panel"
        id={panelId}
        role="region"
      >
        <div className="sdg-accordion-inner">
          <div className="indicator-list">
            {sdgIndicators.map((indicator) => (
              <p key={indicator.code}>
                <b>{indicator.code}</b> {indicator.text}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
