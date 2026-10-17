"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { homeMoods, homePhotos } from "@/components/landing/home/home-content";
import {
  DoodleArrow,
  HeroStar,
} from "@/components/landing/home/reused/doodles";

function HeroCollage() {
  const [mood, setMood] = useState(3);

  return (
    <div className="hero-collage" aria-label="Kolase keseharian remaja">
      <div className="shape shape-sky" />
      <div className="shape shape-yellow" />
      <figure className="photo photo-main">
        <Image
          src={homePhotos.friends}
          alt="Sekelompok remaja menghabiskan waktu bersama"
          fill
          priority
          sizes="(max-width: 720px) 250px, 325px"
        />
      </figure>
      <figure className="photo photo-top">
        <Image
          src={homePhotos.girls}
          alt="Dua sahabat tertawa bersama"
          fill
          sizes="(max-width: 720px) 190px, 245px"
        />
      </figure>
      <figure className="photo photo-small">
        <Image
          src={homePhotos.portrait}
          alt="Remaja tersenyum mengenakan hijab"
          fill
          sizes="170px"
        />
      </figure>
      <span className="sticker-stay">pelan-pelan, ya!</span>
      <HeroStar />
      <div className="mood-widget">
        <div className="mood-title">
          <span>Check-in hari ini</span>
          <small>Gimana perasaanmu?</small>
        </div>
        <div className="mood-row">
          {homeMoods.map((item, index) => (
            <button
              aria-label={item.label}
              aria-pressed={mood === index}
              className={mood === index ? "active" : ""}
              key={item.label}
              onClick={() => setMood(index)}
              type="button"
            >
              <Image
                src={mood === index ? item.activeIcon : item.icon}
                alt=""
                width={26}
                height={26}
              />
            </button>
          ))}
        </div>
      </div>
      <DoodleArrow className="hero-arrow" />
    </div>
  );
}

export function HomeHeroSection() {
  return (
    <section className="hero" id="home">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> Teman cerita untukmu
          </div>
          <h1>
            Ruang untuk cerita,
            <br />
            kenali diri,
            <br />
            dan <em>tumbuh.</em>
          </h1>
          <p>
            Kenali perasaanmu, tuliskan ceritamu, dan temukan langkah kecil
            untuk menjalani hari bersama TemanTumbuh.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/register">
              Mulai Bercerita <ArrowRight className="icon" size={19} />
            </Link>
            <Link className="text-link" href="#features">
              Kenali Fiturnya <span>↘</span>
            </Link>
          </div>
          <div className="safe-note">
            <span>
              <ShieldCheck className="icon" size={18} />
            </span>
            <p>
              <strong>Ruangmu, ceritamu.</strong> Privasi dan kenyamananmu
              selalu berarti.
            </p>
          </div>
        </div>
        <HeroCollage />
      </div>
    </section>
  );
}
