import type { ReactNode } from "react";
import Link from "next/link";
import { FileWarning } from "lucide-react";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

interface LegalPageProps {
  eyebrow: string;
  title: ReactNode;
  intro: string;
  lastUpdated: string;
  sections: LegalSection[];
  related: { href: string; label: string; text: string };
}

// Kerangka bersama halaman Syarat & Ketentuan dan Kebijakan Privasi.
export function LegalPage({
  eyebrow,
  title,
  intro,
  lastUpdated,
  sections,
  related,
}: LegalPageProps) {
  return (
    <main className="tt-landing legal-page">
      <section className="legal-hero">
        <div className="shell legal-hero-inner">
          <span className="eyebrow">
            <span />
            {eyebrow}
          </span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="legal-meta">
            <span>Terakhir diperbarui: {lastUpdated}</span>
            <span>Berlaku untuk pengguna TemanTumbuh</span>
          </div>
          <div className="legal-draft" role="note">
            <FileWarning aria-hidden="true" />
            <span>
              <strong>Draf untuk ditinjau.</strong> Dokumen ini disusun
              berdasarkan cara kerja aplikasi saat ini dan belum ditinjau secara
              hukum. Isinya dapat berubah sebelum versi final diterbitkan.
            </span>
          </div>
        </div>
      </section>

      <section className="legal-body">
        <div className="shell legal-layout">
          <nav className="legal-toc" aria-label="Daftar isi">
            <h2>Daftar isi</h2>
            <ol>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-content">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="legal-section"
                aria-labelledby={`${section.id}-title`}
              >
                <h2 id={`${section.id}-title`}>
                  <span aria-hidden="true">{index + 1}.</span>
                  {section.title}
                </h2>
                {section.content}
              </section>
            ))}

            <p className="legal-related">
              {related.text} <Link href={related.href}>{related.label}</Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
