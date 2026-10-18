"use client";

import type { ReactNode } from "react";

import "@/components/landing/home/landing-redesign.css";
import "@/components/auth/redesign/auth-redesign.css";

import { DoodleArrow } from "@/components/landing/home/reused/doodles";
import { MoodFaceIcon } from "@/components/mood/mood-face-icons";
import { cn } from "@/lib/utils";

const visualMoods = [2, 3, 4, 5];

// Panel dekoratif kiri dari desain auth; seluruhnya aria-hidden kecuali copy.
function AuthVisual() {
  return (
    <aside className="auth-visual">
      <div className="auth-visual-copy">
        <span className="kicker">Ruangmu, ceritamu</span>
        <h2>
          Cerita kecilmu punya ruang untuk <em>tumbuh.</em>
        </h2>
        <p>
          Kenali perasaanmu dengan ritme yang nyaman—satu check-in dan satu
          cerita dalam satu waktu.
        </p>
      </div>
      <div className="auth-collage" aria-hidden="true">
        <div className="auth-shape auth-shape-mint" />
        <div className="auth-shape auth-shape-yellow" />
        <div className="auth-diary-note">
          <span>Catatan hari ini</span>
          <strong>
            Aku boleh berjalan
            <br />
            pelan-pelan.
          </strong>
          <i />
          <i />
        </div>
        <div className="auth-mood-note">
          <span>Perasaanku</span>
          <div>
            {visualMoods.map((score) => (
              <b key={score} className={score === 4 ? "active" : undefined}>
                <MoodFaceIcon score={score} size={26} active={score === 4} />
              </b>
            ))}
          </div>
          <small>Senang · dipilih</small>
        </div>
        <span className="auth-sticker">mulai dari jujur pada diri</span>
        <DoodleArrow className="auth-doodle" />
      </div>
    </aside>
  );
}

interface AuthSplitLayoutProps {
  children: ReactNode;
  cardClassName?: string;
}

export function AuthSplitLayout({
  children,
  cardClassName,
}: AuthSplitLayoutProps) {
  return (
    <div className="tt-landing tt-auth-redesign">
      <section className="auth-stage">
        <div className="shell auth-layout">
          <AuthVisual />
          <div className={cn("auth-form-card", cardClassName)}>{children}</div>
        </div>
      </section>
    </div>
  );
}

export function AuthFormHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="auth-form-heading">
      <span className="handwritten">{eyebrow}</span>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
