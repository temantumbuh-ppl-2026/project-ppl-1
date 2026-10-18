"use client";

import { useId, useState } from "react";
import Link from "next/link";

import type { PricingFaq } from "./pricing-data";

// Accordion satu-terbuka: bisa dioperasikan dengan mouse maupun keyboard.
export function PricingFaqList({ faqs }: { faqs: PricingFaq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="faq-list">
      {faqs.map((faq, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <div className={`faq-item${open ? " open" : ""}`} key={faq.question}>
            <h3 style={{ margin: 0, fontSize: "inherit" }}>
              <button
                aria-controls={panelId}
                aria-expanded={open}
                className="faq-toggle"
                id={buttonId}
                onClick={() => setOpenIndex(open ? null : index)}
                type="button"
              >
                <span>{faq.question}</span>
                <span aria-hidden="true" className="faq-icon" />
              </button>
            </h3>
            <div
              aria-hidden={!open}
              aria-labelledby={buttonId}
              className="faq-panel"
              id={panelId}
              role="region"
            >
              <div className="faq-panel-inner">
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                  {faq.link && (
                    <Link
                      className="text-link"
                      href={faq.link.href}
                      tabIndex={open ? 0 : -1}
                    >
                      {faq.link.label} <span>→</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
