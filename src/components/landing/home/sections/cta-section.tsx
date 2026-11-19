import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  ClosingStar,
  DoodleArrow,
} from "@/components/landing/home/reused/doodles";

export function HomeCtaSection() {
  return (
    <section className="closing" id="daftar">
      <div className="shell closing-inner">
        <ClosingStar />
        <span className="handwritten">ceritamu layak didengar</span>
        <h2>
          Siap Mulai
          <br />
          Perjalananmu?
        </h2>
        <p>
          Bergabunglah dengan TemanTumbuh dan mulai kenali dirimu, satu cerita
          kecil dalam satu waktu.
        </p>
        <Link className="button button-light" href="/register">
          Mulai Bercerita <ArrowRight className="icon" size={19} />
        </Link>
        <DoodleArrow className="closing-arrow" />
      </div>
    </section>
  );
}
