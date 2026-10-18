import Image from "next/image";

import { sdgPillars } from "@/components/landing/about/about-data";
import { SdgIndicatorAccordion } from "@/components/landing/about/sdg-accordion";

export function AboutSdgSection() {
  return (
    <section className="sdg section" id="sdg">
      <div className="shell">
        <div className="sdg-heading">
          <div>
            <span className="kicker">Kontribusi yang selaras</span>
            <h2>
              Komitmen terhadap
              <br />
              <em>SDG 16.2.</em>
            </h2>
          </div>
          <p>
            TemanTumbuh mengambil peran pendukung dalam upaya perlindungan anak
            dari kekerasan melalui pencegahan, edukasi, dan ruang refleksi yang
            menjaga privasi.
          </p>
        </div>

        <div className="sdg-layout">
          <article className="sdg-panel">
            <div className="sdg-id">
              <Image
                src="/img/sgds16.png"
                alt="Logo SDG 16: Peace, Justice and Strong Institutions"
                width={95}
                height={95}
              />
              <div>
                <span>SDG 16.2</span>
                <strong>
                  Mengakhiri kekerasan, eksploitasi, perdagangan, dan segala
                  bentuk kekerasan terhadap anak.
                </strong>
              </div>
            </div>
            <div className="sdg-focus">
              <span>Fokus kontribusi TemanTumbuh</span>
              <h3>
                Pencegahan dimulai dari ruang yang aman untuk memahami diri.
              </h3>
              <p>
                Fitur kami dirancang untuk mendukung kesadaran diri, edukasi
                keputusan aman, dan komunikasi keluarga—bukan sebagai bukti
                pencapaian indikator SDG.
              </p>
            </div>
            <SdgIndicatorAccordion />
          </article>

          <div className="pillar-grid">
            {sdgPillars.map((pillar, index) => (
              <article key={pillar.title}>
                <span>Pilar 0{index + 1}</span>
                <strong>{pillar.title}</strong>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
