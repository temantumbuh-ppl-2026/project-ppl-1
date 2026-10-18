import Image from "next/image";

import { aboutImages } from "@/components/landing/about/about-data";

export function AboutVisionSection() {
  return (
    <section className="about-vision section" id="visi">
      <div className="shell vision-grid">
        <div className="vision-photo-wrap">
          <figure className="vision-photo">
            <Image
              src={aboutImages.youth}
              alt="Remaja yang percaya diri dan siap bertumbuh"
              fill
              sizes="(max-width: 720px) 90vw, 520px"
            />
          </figure>
          <span className="vision-sticker">berani jadi diri sendiri</span>
        </div>
        <div className="vision-copy">
          <span className="handwritten">visi kami</span>
          <h2>Setiap Remaja Berhak Tumbuh dengan Aman dan Percaya Diri.</h2>
          <p>
            TemanTumbuh hadir dari kepedulian terhadap meningkatnya tekanan
            emosional dan sosial pada remaja Indonesia. Kami percaya teknologi
            yang dirancang dengan tepat dapat menjadi teman setia dalam proses
            tumbuh mereka.
          </p>
          <div className="vision-line">
            <span /> tumbuh dengan ritmemu
          </div>
        </div>
      </div>
    </section>
  );
}
