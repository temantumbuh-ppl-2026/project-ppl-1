"use client";

import Link from "next/link";
import { ArrowRight, BookText, CalendarDays } from "lucide-react";

export function HomeDashboardWelcome({
  userName,
  dateLabel,
}: {
  userName: string;
  dateLabel: string;
}) {
  return (
    <section className="dash-welcome" aria-labelledby="dash-welcome-title">
      <div className="welcome-copy">
        <span className="dash-date">
          <CalendarDays size={16} aria-hidden="true" /> {dateLabel}
        </span>
        <h1 id="dash-welcome-title">
          Selamat datang kembali, <em>{userName}!</em>
        </h1>
        <p>Ada cerita apa hari ini?</p>
      </div>

      <div className="welcome-action">
        <div className="welcome-icon" aria-hidden="true">
          <BookText size={26} />
        </div>
        <p>
          <strong>TemanCerita</strong>
          <span>
            Ceritakan harimu dan refleksikan perasaanmu bersama teman yang siap
            mendengarkan.
          </span>
        </p>
        <Link className="dash-button" href="/diary">
          Mulai Bercerita <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <svg className="welcome-doodle" viewBox="0 0 90 55" aria-hidden="true">
        <path d="M4 41c18-35 34 13 52-12 9-13 18-13 29-7M72 12l14 10-13 8" />
      </svg>
    </section>
  );
}
