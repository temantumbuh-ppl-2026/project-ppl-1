import { BookOpen, Compass, Heart } from "lucide-react";

import { DoodleArrow } from "@/components/landing/home/reused/doodles";

export function HomeHowSection() {
  return (
    <section className="how section" id="how">
      <div className="shell">
        <div className="how-title">
          <span className="handwritten">nggak perlu buru-buru</span>
          <h2>
            Tiga langkah kecil
            <br />
            untuk mulai.
          </h2>
          <p>
            Sederhana dan mudah digunakan, bahkan di hari yang terasa ramai.
          </p>
        </div>
        <div className="steps">
          <article>
            <span className="step-no">1</span>
            <div className="step-icon">
              <Heart className="icon" size={26} />
            </div>
            <h3>Check-in sebentar</h3>
            <p>Pilih suasana hatimu. Tidak ada jawaban yang salah.</p>
          </article>
          <DoodleArrow className="step-arrow one" />
          <article>
            <span className="step-no">2</span>
            <div className="step-icon">
              <BookOpen className="icon" size={26} />
            </div>
            <h3>Ceritakan harimu</h3>
            <p>Tulis sebebasnya atau mulai dengan prompt yang tersedia.</p>
          </article>
          <DoodleArrow className="step-arrow two" />
          <article>
            <span className="step-no">3</span>
            <div className="step-icon">
              <Compass className="icon" size={26} />
            </div>
            <h3>Kenali polanya</h3>
            <p>Lihat insight dan pilih langkah kecil yang ingin kamu coba.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
