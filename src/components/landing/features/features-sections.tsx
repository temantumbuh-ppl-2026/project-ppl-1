import Link from "next/link";
import { ArrowRight, BookOpen, Check, ShieldCheck, Users } from "lucide-react";

import { DoodleArrow } from "@/components/landing/home/reused/doodles";

import { BraveDemo } from "./brave-demo";
import { ChatDemo } from "./chat-demo";
import { InsightDemo } from "./insight-demo";
import { MoodDemo } from "./mood-demo";

// Tujuan CTA mengikuti route aplikasi; guard login/profil/premium ditangani
// oleh halaman tujuan masing-masing.

const diaryPoints = [
  "Percakapan yang membantu kamu berefleksi",
  "Pertanyaan lanjutan yang relevan",
  "Riwayat cerita untuk dilihat kembali",
  "Isi ceritamu disimpan terenkripsi",
] as const;

const insightPoints = [
  "Tren Mood sepanjang bulan",
  "Ringkasan Mood dan refleksi harian",
  "Rekomendasi dukungan untuk langkah berikutnya",
] as const;

const notSharedItems = [
  "Isi diary atau jurnal pribadi",
  "Hasil refleksi AI yang personal",
  "Pesan atau catatan yang kamu tulis",
  "Detail skor per sesi Brave Choice",
] as const;

export function FeaturesDiary() {
  return (
    <section className="feature-section story-section" id="daftar-fitur">
      <div className="shell feature-split" id="temancerita">
        <div className="feature-copy">
          <span className="feature-big-number">01</span>
          <span className="kicker">TemanCerita</span>
          <h2>Cerita pelan-pelan, mulai dari yang kamu rasakan.</h2>
          <p>
            Percakapan terpandu membantumu mengurai cerita lewat pertanyaan
            reflektif yang terasa dekat, tanpa terburu-buru.
          </p>
          <ul className="feature-points">
            {diaryPoints.map((point) => (
              <li key={point}>
                <span>
                  <Check className="icon" size={12} />
                </span>{" "}
                {point}
              </li>
            ))}
          </ul>
          <Link className="button" href="/diary">
            Coba TemanCerita <ArrowRight className="icon" size={18} />
          </Link>
        </div>
        <ChatDemo />
      </div>
    </section>
  );
}

export function FeaturesBraveChoice() {
  return (
    <section className="feature-section brave-section" id="brave-choice">
      <div className="shell feature-split reverse">
        <BraveDemo />
        <div className="feature-copy">
          <span className="feature-big-number">02</span>
          <span className="kicker">Brave Choice</span>
          <h2>Latih pilihan bijakmu lewat skenario sehari-hari.</h2>
          <p>
            Pilih respons untuk situasi yang dekat dengan kehidupan sehari-hari,
            lalu baca penjelasannya. Bukan soal benar atau salah di depan siapa
            pun—ini ruang untuk berlatih berpikir dan berkomunikasi.
          </p>
          <div className="handwritten-note">
            coba dulu, refleksikan kemudian
          </div>
          <p className="demo-note">
            Brave Choice Quiz ada di halaman diary. Akun gratis punya batas
            latihan harian, Premium membuka akses tanpa batas.
          </p>
          <div className="feature-cta-row">
            <Link className="button" href="/diary">
              Coba Brave Choice <ArrowRight className="icon" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesMood() {
  return (
    <section className="feature-section mood-section" id="mood-checkin">
      <div className="shell feature-split">
        <div className="feature-copy">
          <span className="feature-big-number">03</span>
          <span className="kicker">Mood Check-in</span>
          <h2>Beri ruang untuk perasaanmu hari ini.</h2>
          <p>
            Pilih suasana hatimu dan tambahkan catatan singkat jika kamu mau.
            Tidak ada mood yang salah—semuanya layak dikenali.
          </p>
          <Link className="button" href="/mood">
            Catat Mood Hari Ini <ArrowRight className="icon" size={18} />
          </Link>
        </div>
        <MoodDemo />
      </div>
    </section>
  );
}

export function FeaturesInsight() {
  return (
    <section className="feature-section insight-section" id="insight">
      <div className="shell feature-split reverse">
        <InsightDemo />
        <div className="feature-copy">
          <span className="feature-big-number">04</span>
          <span className="feature-badge">Fitur Premium</span>
          <span className="kicker">Insight Dashboard</span>
          <h2>Lihat pola, pahami dirimu lebih dekat.</h2>
          <p>
            Temukan hubungan antara mood dan catatan harianmu lewat visual yang
            sederhana. Insight membantumu melihat pola, bukan memberi diagnosis.
          </p>
          <ul className="feature-points">
            {insightPoints.map((point) => (
              <li key={point}>
                <span>
                  <Check className="icon" size={12} />
                </span>{" "}
                {point}
              </li>
            ))}
          </ul>
          <div className="feature-cta-row">
            <Link className="button" href="/insight">
              Kenali Insight <ArrowRight className="icon" size={18} />
            </Link>
            <Link className="text-link" href="/pricing">
              Lihat paket <span>↗</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesQuote() {
  return (
    <section className="feature-quote">
      <div className="shell">
        <span className="quote-scribble">ingat, ya—</span>
        <blockquote>
          “Bukan tentang sempurna, tapi tentang berani jujur dengan diri
          sendiri.”
        </blockquote>
        <svg viewBox="0 0 210 30" aria-hidden="true">
          <path pathLength={100} d="M3 18c38-13 73 9 113-3 32-10 58-7 91 2" />
        </svg>
      </div>
    </section>
  );
}

export function FeaturesPrivacy() {
  return (
    <section className="privacy-section section" id="privasi">
      <div className="shell privacy-grid">
        <div className="privacy-copy">
          <span className="kicker">Privasi &amp; dukungan</span>
          <h2>Privasi Terjaga, Kepercayaan Terbangun.</h2>
          <p>
            Cerita pribadimu dan laporan untuk orang tua adalah dua hal yang
            berbeda. Orang tua atau wali hanya menerima laporan mingguan yang
            bersifat umum, dan hanya setelah mereka menyetujui permintaan yang
            kamu kirim.
          </p>
          <div className="privacy-notes">
            <div>
              <BookOpen className="icon" size={21} />
              <p>
                <strong>Isi cerita pribadi</strong>
                Detail yang kamu tulis di diary tidak dikirim ke orang tua.
              </p>
            </div>
            <div>
              <ShieldCheck className="icon" size={21} />
              <p>
                <strong>Laporan mingguan</strong>
                Gambaran umum mood dan perkembanganmu, dikirim ke email orang
                tua/wali yang sudah terhubung.
              </p>
            </div>
          </div>
        </div>
        <div className="privacy-preview">
          <div className="demo-topline">
            <span>Laporan mingguan orang tua</span>
            <span className="demo-label">Contoh tampilan</span>
          </div>
          <span className="summary-date">Setiap minggu</span>
          <h3>Gambaran umum, bukan isi ceritamu.</h3>
          <p>
            Orang tua menerima ringkasan umum tentang perkembangan moodmu agar
            bisa mendampingi tanpa membaca diary pribadimu.
          </p>
          <div className="share-preview">
            <span>
              <Users className="icon" size={18} /> Yang tidak dikirim ke orang
              tua
            </span>
            <ul className="not-sent-list">
              {notSharedItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              Kamu bisa mengatur atau memutus hubungan dengan orang tua kapan
              saja dari pengaturan laporan.
            </p>
            <Link className="text-link" href="/profile/parent-report">
              Atur laporan orang tua <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturesCTA() {
  return (
    <section className="closing features-closing">
      <div className="shell closing-inner">
        <span className="handwritten">mulai dari sini</span>
        <h2>
          Mulai dari satu cerita.
          <br />
          Lanjutkan dengan langkah kecil.
        </h2>
        <p>
          Tidak perlu menunggu semuanya terasa jelas. Kenali satu perasaan,
          tulis satu cerita, lalu tumbuh dengan ritmemu.
        </p>
        <div className="features-cta-actions">
          <Link className="button button-light" href="/register">
            Daftar Gratis <ArrowRight className="icon" size={19} />
          </Link>
          <Link className="closing-link" href="/">
            Jelajahi TemanTumbuh <span>↗</span>
          </Link>
        </div>
        <DoodleArrow className="closing-arrow" />
      </div>
    </section>
  );
}
