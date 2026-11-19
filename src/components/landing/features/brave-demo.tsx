"use client";

import { useState } from "react";

import { braveChoiceOptions } from "./features-data";

// Contoh lokal Brave Choice: pilih respons, lalu lihat penjelasannya.
export function BraveDemo() {
  const [choice, setChoice] = useState<string | null>(null);
  const selected = braveChoiceOptions.find((option) => option.id === choice);

  return (
    <div className="brave-demo product-demo">
      <div className="demo-topline light">
        <span>Brave Choice</span>
        <span className="demo-label">Contoh tampilan</span>
      </div>
      <p className="scenario">
        “Teman meminjam barangmu dan belum mengembalikannya, padahal kamu sedang
        membutuhkannya.”
      </p>
      <span className="choice-label">Apa yang mungkin kamu lakukan?</span>
      {braveChoiceOptions.map((option) => (
        <button
          aria-pressed={choice === option.id}
          className={choice === option.id ? "choice active" : "choice"}
          key={option.id}
          onClick={() => setChoice(option.id)}
          type="button"
        >
          <i /> {option.text}
        </button>
      ))}
      <div className="consequence" aria-live="polite">
        {selected ? (
          <>
            <strong>{selected.title}</strong>
            {selected.explanation}
          </>
        ) : (
          <>
            <strong>Penjelasan</strong>
            Pilih salah satu respons untuk melihat penjelasannya, seperti di
            Brave Choice.
          </>
        )}
      </div>
    </div>
  );
}
