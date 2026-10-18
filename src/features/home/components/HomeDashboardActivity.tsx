"use client";

import { Flame } from "lucide-react";
import type { MoodDay } from "../types";

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

function streakMessage(streak: number) {
  if (streak <= 0) return "Mulai lagi hari ini—satu check-in sudah berarti.";
  if (streak === 1) return "Satu hari tercatat—langkah kecilmu tetap berarti.";
  return `${streak} hari berturut-turut. Pertahankan ritmemu dengan nyaman.`;
}

// Streak & jejak 7 hari dihitung dari check-in mood (sumber existing),
// sedangkan total diary berasal dari /api/diary/count.
export function HomeDashboardActivity({
  currentStreak,
  longestStreak,
  totalDiaries,
  streakWeek,
}: {
  currentStreak: number;
  longestStreak: number;
  totalDiaries: number;
  streakWeek: MoodDay[];
}) {
  const recordedDays = streakWeek.filter((d) => d.score !== null).length;

  return (
    <section className="dash-activity" aria-labelledby="activity-title">
      <div className="activity-streak-panel">
        <span className="dash-kicker">Ringkasan aktivitas</span>
        <div className="streak-main">
          <Flame size={42} aria-hidden="true" />
          <strong>{currentStreak}</strong>
          <span>hari</span>
        </div>
        <h3>Streak check-in mood</h3>
        <p>{streakMessage(currentStreak)}</p>
      </div>

      <div className="activity-details">
        <div className="activity-heading">
          <h2 id="activity-title">Langkah kecilmu sejauh ini</h2>
          <p>Belum banyak pun tidak apa-apa. Setiap catatan tetap berarti.</p>
        </div>

        <div className="activity-stats">
          <article>
            <strong>{longestStreak}</strong>
            <span>hari</span>
            <p>Streak terpanjang</p>
          </article>
          <article>
            <strong>{totalDiaries}</strong>
            <span>diary</span>
            <p>Total diary</p>
          </article>
        </div>

        <div className="daily-streak">
          <div>
            <strong>Check-in mood minggu ini</strong>
            <span>{recordedDays} hari tercatat</span>
          </div>
          <ol aria-label="Check-in mood minggu ini">
            {streakWeek.map((d, i) => {
              const fullDay = d.fullDate
                ? DAY_NAMES[d.fullDate.getDay()]
                : d.day;
              const active = d.score !== null;
              return (
                <li
                  key={`${d.day}-${d.date}-${i}`}
                  className={`${active ? "active" : ""} ${d.today ? "today" : ""}`}
                  aria-label={`${fullDay}: ${active ? "check-in tercatat" : "belum tercatat"}`}
                >
                  <span />
                  <small aria-hidden="true">{d.day[0]}</small>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
