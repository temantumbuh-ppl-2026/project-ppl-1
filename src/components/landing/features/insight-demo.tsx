"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { MoodFaceIcon } from "@/components/mood/mood-face-icons";

import {
  monthlyMoodHistory,
  weekDayShort,
  weeklyMoodHistory,
} from "./features-data";

type Range = "weekly" | "monthly";

const monthlyCount = Object.keys(monthlyMoodHistory).length;

// Ilustrasi data untuk pengenalan Insight; tidak terhubung ke data pengguna.
export function InsightDemo() {
  const [range, setRange] = useState<Range>("weekly");
  const [dayIndex, setDayIndex] = useState(5);
  const [date, setDate] = useState(18);

  const week = weeklyMoodHistory[dayIndex];
  const month = monthlyMoodHistory[date];

  return (
    <div className="insight-demo product-demo">
      <div className="insight-header">
        <div>
          <span className="demo-label">Ilustrasi data</span>
          <strong>
            {range === "weekly"
              ? "Perasaanmu minggu ini"
              : "Perasaanmu bulan ini"}
          </strong>
          <small>
            {range === "weekly"
              ? "Dari mood yang kamu catat setiap hari"
              : "Mood yang kamu catat per tanggal"}
          </small>
        </div>
        <div className="range-toggle" role="group" aria-label="Rentang data">
          <button
            aria-pressed={range === "weekly"}
            className={range === "weekly" ? "active" : ""}
            onClick={() => setRange("weekly")}
            type="button"
          >
            Mingguan
          </button>
          <button
            aria-pressed={range === "monthly"}
            className={range === "monthly" ? "active" : ""}
            onClick={() => setRange("monthly")}
            type="button"
          >
            Bulanan
          </button>
        </div>
      </div>

      {range === "weekly" ? (
        <>
          <div
            className="weekly-mood-history"
            role="group"
            aria-label="Riwayat mood mingguan"
          >
            {weeklyMoodHistory.map((item, index) => (
              <button
                aria-label={`${item.day}, ${item.label}`}
                aria-pressed={dayIndex === index}
                className={`mood-history-item ${item.tone} ${dayIndex === index ? "active" : ""}`}
                key={item.day}
                onClick={() => setDayIndex(index)}
                type="button"
              >
                <span>
                  <MoodFaceIcon score={item.score} size={32} />
                </span>
                <strong>{item.label}</strong>
                <small>{item.day}</small>
              </button>
            ))}
          </div>
          <div className="mood-history-detail" aria-live="polite">
            <strong>
              {week.day} — {week.label}
            </strong>
            <p>
              <span>Catatanmu:</span> {week.note}
            </p>
          </div>
        </>
      ) : (
        <>
          <div
            className="monthly-mood-calendar"
            role="group"
            aria-label="Kalender mood bulanan"
          >
            {weekDayShort.map((day) => (
              <span className="calendar-day" key={day}>
                {day}
              </span>
            ))}
            {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => {
              const entry = monthlyMoodHistory[day];
              return (
                <button
                  aria-label={`Tanggal ${day}, ${entry?.label ?? "Belum dicatat"}`}
                  aria-pressed={date === day}
                  className={`calendar-date ${entry?.tone ?? "empty"} ${date === day ? "active" : ""}`}
                  key={day}
                  onClick={() => setDate(day)}
                  type="button"
                >
                  <small>{day}</small>
                  <span>
                    {entry ? (
                      <MoodFaceIcon score={entry.score} size={24} />
                    ) : (
                      "·"
                    )}
                  </span>
                  <strong>{entry?.label ?? "Belum dicatat"}</strong>
                </button>
              );
            })}
          </div>
          <div className="mood-history-detail" aria-live="polite">
            <strong>
              Tanggal {date} — {month?.label ?? "Belum dicatat"}
            </strong>
            <p>
              {month ? (
                <>
                  <span>Catatanmu:</span> {month.note}
                </>
              ) : (
                "Belum ada mood atau catatan untuk tanggal ini."
              )}
            </p>
          </div>
        </>
      )}

      <div className="insight-summary">
        <span>
          <Sparkles className="icon" size={18} /> Contoh refleksi
        </span>
        <p>
          {range === "weekly"
            ? "Kamu mencatat perasaan Senang atau Sangat Senang pada Kamis, Sabtu, dan Minggu."
            : `Bulan ini kamu mencatat mood pada ${monthlyCount} hari. Hari lain ditampilkan sebagai belum dicatat.`}
        </p>
      </div>
      <div className="small-step">
        <b>Rekomendasi dukungan</b>
        <span>
          Kalau kamu mau, luangkan waktu untuk kegiatan yang kamu nikmati.
        </span>
      </div>
    </div>
  );
}
