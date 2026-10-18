import "@/components/landing/home/landing-redesign.css";
import "@/components/landing/legal/legal-redesign.css";

import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalPage,
  type LegalSection,
} from "@/components/landing/legal/legal-page";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: "Aturan penggunaan layanan TemanTumbuh.",
};

const CONTACT_EMAIL = "temantumbuh.team@gmail.com";

const sections: LegalSection[] = [
  {
    id: "penerimaan",
    title: "Penerimaan syarat",
    content: (
      <p>
        Dengan membuat akun atau menggunakan TemanTumbuh, kamu menyetujui Syarat
        &amp; Ketentuan ini serta <Link href="/privacy">Kebijakan Privasi</Link>{" "}
        kami. Jika kamu tidak setuju, mohon untuk tidak menggunakan layanan ini.
      </p>
    ),
  },
  {
    id: "layanan",
    title: "Tentang layanan",
    content: (
      <>
        <p>
          TemanTumbuh adalah platform refleksi diri yang menyediakan mood
          check-in, diary dengan pendamping AI, insight, dan Brave Choice untuk
          membantumu mengenali perasaan.
        </p>
        <p>
          <strong>
            TemanTumbuh bukan layanan medis, psikologis, atau darurat
          </strong>{" "}
          dan tidak menggantikan bantuan tenaga profesional. Jika kamu atau
          orang di sekitarmu berada dalam bahaya, segera hubungi layanan darurat
          112 atau tenaga profesional terdekat.
        </p>
      </>
    ),
  },
  {
    id: "akun",
    title: "Akun dan kelayakan",
    content: (
      <ul>
        <li>TemanTumbuh ditujukan untuk pengguna berusia 10–29 tahun.</li>
        <li>
          Pengguna di bawah 18 tahun dianjurkan menggunakan layanan dengan
          sepengetahuan orang tua atau wali.
        </li>
        <li>
          Pendaftaran dengan email memerlukan verifikasi email sebelum akun
          dapat digunakan.
        </li>
        <li>
          Data yang kamu berikan saat mendaftar dan melengkapi profil harus
          benar.
        </li>
      </ul>
    ),
  },
  {
    id: "keamanan-akun",
    title: "Keamanan akun",
    content: (
      <p>
        Kamu bertanggung jawab menjaga kerahasiaan password dan aktivitas di
        akunmu. Jangan bagikan akses akun kepada orang lain. Jika kamu lupa
        password, gunakan fitur{" "}
        <Link href="/forgot-password">lupa password</Link>.
      </p>
    ),
  },
  {
    id: "larangan",
    title: "Penggunaan yang tidak diperbolehkan",
    content: (
      <ul>
        <li>Menggunakan akun orang lain atau menyamar sebagai orang lain.</li>
        <li>Mengganggu, merusak, atau mencoba mengakses sistem tanpa izin.</li>
        <li>
          Menggunakan layanan untuk tujuan yang melanggar hukum atau merugikan
          orang lain.
        </li>
        <li>Menyalahgunakan fitur AI untuk menghasilkan konten berbahaya.</li>
      </ul>
    ),
  },
  {
    id: "konten",
    title: "Kontenmu",
    content: (
      <p>
        Cerita, catatan, dan jawaban yang kamu tulis tetap menjadi milikmu. Kamu
        memberi izin kepada TemanTumbuh untuk menyimpan dan memproses konten
        tersebut sebatas yang diperlukan untuk menjalankan fitur, sebagaimana
        dijelaskan dalam <Link href="/privacy">Kebijakan Privasi</Link>.
      </p>
    ),
  },
  {
    id: "ai",
    title: "Fitur AI",
    content: (
      <p>
        Respons diary dan insight dibuat secara otomatis oleh AI. Respons
        tersebut dapat keliru atau tidak sesuai dengan situasimu, sehingga tidak
        boleh dijadikan satu-satunya dasar untuk keputusan penting.
      </p>
    ),
  },
  {
    id: "langganan",
    title: "Paket dan pembayaran",
    content: (
      <>
        <p>
          TemanTumbuh menyediakan paket Basic secara gratis dan paket Single
          berbayar. Pembayaran paket Single dilakukan di muka melalui Midtrans
          untuk durasi yang kamu pilih. Saat masa langganan berakhir, akunmu
          otomatis kembali ke paket Basic.
        </p>
        <p>
          Detail harga tersedia di halaman{" "}
          <Link href="/pricing">Langganan</Link>. Kebijakan pengembalian dana
          belum ditetapkan; untuk kendala pembayaran, hubungi kami melalui email
          di bawah.
        </p>
      </>
    ),
  },
  {
    id: "orang-tua",
    title: "Laporan orang tua/wali",
    content: (
      <p>
        Kamu dapat menambahkan email orang tua atau wali secara opsional.
        Laporan mingguan hanya dikirim setelah orang tua/wali memberikan
        persetujuan, dan tidak menyertakan isi diary.
      </p>
    ),
  },
  {
    id: "penangguhan",
    title: "Penangguhan akun",
    content: (
      <p>
        Kami dapat menonaktifkan akun yang melanggar Syarat &amp; Ketentuan ini
        atau membahayakan pengguna lain maupun layanan. Akun yang dinonaktifkan
        tidak dapat digunakan untuk masuk.
      </p>
    ),
  },
  {
    id: "tanggung-jawab",
    title: "Batasan tanggung jawab",
    content: (
      <p>
        Layanan disediakan sebagaimana adanya. Kami berupaya menjaga layanan
        tetap tersedia dan aman, namun tidak dapat menjamin layanan selalu bebas
        gangguan atau kesalahan.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan syarat",
    content: (
      <p>
        Syarat &amp; Ketentuan ini dapat diperbarui sewaktu-waktu. Tanggal
        pembaruan terakhir tercantum di bagian atas halaman. Dengan tetap
        menggunakan layanan setelah perubahan, kamu dianggap menyetujui versi
        terbaru.
      </p>
    ),
  },
  {
    id: "kontak",
    title: "Hubungi kami",
    content: (
      <p>
        Pertanyaan tentang Syarat &amp; Ketentuan ini dapat dikirim ke{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Syarat & Ketentuan"
      title={
        <>
          Aturan main untuk ruang yang <em>aman.</em>
        </>
      }
      intro="Ketentuan ini menjelaskan hak dan tanggung jawabmu saat menggunakan TemanTumbuh, supaya ruang cerita ini tetap nyaman untuk semua."
      lastUpdated="18 Oktober 2026"
      sections={sections}
      related={{
        href: "/privacy",
        label: "Kebijakan Privasi",
        text: "Pelajari bagaimana datamu dilindungi di",
      }}
    />
  );
}
