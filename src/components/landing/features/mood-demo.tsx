"use client";

import { useState } from "react";

import { MoodFaceIcon } from "@/components/mood/mood-face-icons";

import { featureMoods } from "./features-data";

const MAX_WORDS = 100;

// Contoh lokal Mood Check-in: tidak ada data yang disimpan atau dikirim.
export function MoodDemo() {
  const [index, setIndex] = useState(3);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const mood = featureMoods[index];
  const words = note.trim().match(/\S+/g)?.length ?? 0;
  const overLimit = words > MAX_WORDS;

  return (
    <div className={`mood-demo product-demo mood-${index}`}>
      <div className="demo-topline">
        <div>Mood check-in</div>
        <span className="demo-label">Contoh tampilan</span>
      </div>
      <div className="mood-picker" role="group" aria-label="Pilih mood">
        {featureMoods.map((item, itemIndex) => (
          <button
            aria-pressed={index === itemIndex}
            className={index === itemIndex ? "active" : ""}
            key={item.score}
            onClick={() => {
              setIndex(itemIndex);
              setSaved(false);
            }}
            type="button"
          >
            <b>
              <MoodFaceIcon
                score={item.score}
                size={34}
                active={index === itemIndex}
              />
            </b>
            <span>{item.label}</span>
            {index === itemIndex && <small>Dipilih</small>}
          </button>
        ))}
      </div>
      <div className="mood-response" aria-live="polite">
        <span>
          Mood dipilih: <strong>{mood.label}</strong>
        </span>
        <p>{mood.reply}</p>
      </div>
      <label className="note-field">
        <span>
          Catatan singkat <small>(opsional, maksimal {MAX_WORDS} kata)</small>
        </span>
        <textarea
          onChange={(event) => {
            setNote(event.target.value);
            setSaved(false);
          }}
          placeholder="Ceritakan sedikit tentang harimu... Ada hal yang membuatmu merasa seperti ini?"
          rows={3}
          value={note}
        />
      </label>
      {overLimit && (
        <p className="demo-note" role="alert">
          Catatan melebihi {MAX_WORDS} kata, sama seperti di aplikasi.
        </p>
      )}
      <button
        className="demo-save"
        disabled={overLimit}
        onClick={() => setSaved(true)}
        type="button"
      >
        Simpan check-in
      </button>
      {saved && (
        <p className="demo-note" aria-live="polite">
          Ini hanya contoh tampilan, tidak ada yang tersimpan. Check-in
          sungguhan dicatat dari halaman Mood setelah kamu masuk.
        </p>
      )}
    </div>
  );
}
