import Image from "next/image";
import Link from "next/link";
import { BookOpen, Check } from "lucide-react";

import {
  homeDiaryPoints,
  homeFeatureItems,
} from "@/components/landing/home/home-content";
import { FeatureIcon } from "@/components/landing/home/reused/feature-icons";
import { CanvasSquiggle } from "@/components/landing/home/reused/doodles";

function DiaryFeature() {
  return (
    <article className="diary-feature">
      <div className="diary-copy">
        <span className="feature-number">01</span>
        <div className="feature-icon mint">
          <BookOpen className="icon" size={24} />
        </div>
        <h3>Digital Diary</h3>
        <p>
          Tuangkan cerita, pikiran, dan hal-hal kecil dari harimu dalam ruang
          pribadi yang terasa aman dan ringan.
        </p>
        <ul>
          {homeDiaryPoints.map((point) => (
            <li key={point}>
              <span>
                <Check className="icon" size={12} />
              </span>
              {point}
            </li>
          ))}
        </ul>
        <Link className="text-link" href="/register">
          Coba tulis cerita <span>→</span>
        </Link>
      </div>

      {/* Ilustrasi dekoratif, bukan antarmuka yang bisa dipakai. */}
      <div className="diary-canvas" aria-hidden="true">
        <div className="paper-tape" />
        <div className="diary-window">
          <div className="window-top">
            <div>
              <small>Rabu, 24 April</small>
              <strong>Apa yang ada di pikiranmu?</strong>
            </div>
            <span>Privat</span>
          </div>
          <div className="writing">
            Hari ini aku belajar kalau tidak apa-apa untuk
            <span> berjalan lebih pelan.</span>
            <i />
            <i />
            <i />
          </div>
          <div className="diary-bottom">
            <span>Perasaanku hari ini</span>
            <div>
              <Image
                src="/img/Emojis/HappyActive.png"
                alt=""
                width={18}
                height={18}
              />
              Cukup baik
            </div>
            <span className="save-pill">Simpan cerita</span>
          </div>
        </div>
        <span className="tiny-note">punyamu sepenuhnya</span>
        <CanvasSquiggle />
      </div>
    </article>
  );
}

export function HomeFeaturesSection() {
  return (
    <section className="features section" id="features">
      <div className="shell">
        <div className="section-heading features-heading">
          <div>
            <span className="kicker">Fitur unggulan</span>
            <h2>
              Satu ruang, banyak cara
              <br />
              untuk memahami <em>dirimu.</em>
            </h2>
          </div>
          <p>
            Setiap fitur dirancang sebagai teman kecil yang bisa kamu datangi
            kapan saja, tanpa menghakimi.
          </p>
        </div>

        <DiaryFeature />

        <div className="feature-row">
          {homeFeatureItems.map((feature, index) => (
            <article className="feature-item" key={feature.title}>
              <span className="feature-number">0{index + 2}</span>
              <div className={`feature-icon ${feature.color}`}>
                <FeatureIcon name={feature.icon} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <Link aria-label={`Pelajari ${feature.title}`} href="/features">
                Lihat caranya <span>↗</span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
