import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  ClosingStar,
  DoodleArrow,
} from "@/components/landing/home/reused/doodles";

export function AboutCtaSection() {
  return (
    <section className="closing about-closing" id="mulai">
      <div className="shell closing-inner">
        <ClosingStar />
        <span className="handwritten">langkah kecil, berarti</span>
        <h2>
          Mari Tumbuh Bersama.
          <br />
          Mulai Perjalananmu Sekarang.
        </h2>
        <p>
          Kenali perasaanmu, tulis ceritamu, dan mulai perjalanan refleksi diri
          bersama TemanTumbuh.
        </p>
        <div className="about-cta-actions">
          <Link className="button button-light" href="/register">
            Daftar Gratis Sekarang <ArrowRight className="icon" size={19} />
          </Link>
          <Link className="closing-link" href="/features">
            Lihat Platform <span>↗</span>
          </Link>
        </div>
        <DoodleArrow className="closing-arrow" />
      </div>
    </section>
  );
}
