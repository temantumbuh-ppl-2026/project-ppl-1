import { BookOpen, Compass, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

import {
  missionValues,
  type AboutIconName,
} from "@/components/landing/about/about-data";

const missionIcons: Record<
  AboutIconName,
  ComponentType<{ className?: string; size?: number }>
> = {
  compass: Compass,
  book: BookOpen,
  shield: ShieldCheck,
};

export function AboutMissionSection() {
  return (
    <section className="about-mission section" id="misi">
      <div className="shell">
        <div className="about-section-title">
          <span className="kicker">Yang kami perjuangkan</span>
          <h2>
            Misi &amp; Nilai
            <br />
            <em>TemanTumbuh.</em>
          </h2>
          <p>
            Tiga pilar yang menjadi fondasi setiap fitur dan keputusan desain
            platform kami.
          </p>
        </div>
        <div className="mission-list">
          {missionValues.map((item, index) => {
            const Icon = missionIcons[item.icon];
            return (
              <article key={item.title}>
                <span className="mission-number">0{index + 1}</span>
                <div className="mission-icon">
                  <Icon className="icon" size={24} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
