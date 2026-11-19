import Image from "next/image";
import { Compass, ShieldCheck, Users } from "lucide-react";
import type { ComponentType } from "react";

import {
  homePhotos,
  homeValueItems,
  type HomeValueItem,
} from "@/components/landing/home/home-content";
import { SmileDoodle } from "@/components/landing/home/reused/doodles";

const valueIcons: Record<
  HomeValueItem["icon"],
  ComponentType<{ className?: string; size?: number }>
> = {
  shield: ShieldCheck,
  people: Users,
  compass: Compass,
};

export function HomePurposeSection() {
  return (
    <section className="values section" id="purpose">
      <div className="shell values-grid">
        <div className="values-visual">
          <div className="value-photo">
            <Image
              src={homePhotos.friends}
              alt="Kebersamaan remaja yang saling mendukung"
              fill
              sizes="(max-width: 720px) 90vw, 520px"
            />
          </div>
          <div className="quote-sticker">
            jadi diri sendiri
            <br />
            juga bentuk berani.
          </div>
          <SmileDoodle />
        </div>
        <div className="values-copy">
          <span className="kicker">Kenapa TemanTumbuh?</span>
          <h2>Tumbuh bukan soal jadi sempurna.</h2>
          <p className="lead">
            TemanTumbuh hadir untuk membantumu lebih mengenal diri—dengan ritme
            yang nyaman dan cara yang terasa dekat.
          </p>
          <div className="value-list">
            {homeValueItems.map((item) => {
              const Icon = valueIcons[item.icon];
              return (
                <div key={item.title}>
                  <span>
                    <Icon className="icon" size={24} />
                  </span>
                  <p>
                    <strong>{item.title}</strong>
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
