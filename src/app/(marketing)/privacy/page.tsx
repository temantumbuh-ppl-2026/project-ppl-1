import "@/components/landing/home/landing-redesign.css";
import "@/components/landing/legal/legal-redesign.css";

import type { Metadata } from "next";
import Link from "next/link";

import {
  LegalPage,
  type LegalSection,
} from "@/components/landing/legal/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Bagaimana TemanTumbuh mengumpulkan, menggunakan, dan melindungi data penggunanya.",
};

const CONTACT_EMAIL = "temantumbuh.team@gmail.com";

const sections: LegalSection[] = [
  {
    id: "tentang",
    title: "Tentang kebijakan ini",
    content: (
      <>
        <p>
          Kebijakan Privasi ini menjelaskan data apa yang dikumpulkan
          TemanTumbuh, bagaimana data tersebut digunakan, dan pilihan yang kamu
          miliki. TemanTumbuh adalah platform refleksi diri untuk usia 10–29
          tahun yang dikembangkan oleh Kelompok Cegukan sebagai proyek mata
          kuliah Proyek Perangkat Lunak di Universitas Padjadjaran.
        </p>
        <p>
          Dengan membuat akun atau menggunakan TemanTumbuh, kamu memahami bahwa
          datamu diproses sesuai kebijakan ini.
        </p>
      </>
    ),
  },
  {
    id: "data-dikumpulkan",
    title: "Data yang kami kumpulkan",
    content: (
      <>
        <ul>
          <li>
            <strong>Data akun:</strong> email, nama, dan password. Password
            tidak disimpan dalam bentuk teks biasa. Jika kamu masuk dengan
            Google, kami menerima nama, email, dan foto profil dari akun
            Google-mu.
          </li>
          <li>
            <strong>Data profil:</strong> tahun lahir, jenis kelamin, dan email
            orang tua/wali (opsional).
          </li>
          <li>
            <strong>Konten yang kamu buat:</strong> check-in mood beserta
            catatannya, percakapan diary, jawaban kuis atau pertanyaan awal,
            serta pilihan Brave Choice.
          </li>
          <li>
            <strong>Data pembayaran:</strong> nomor pesanan, nominal, metode dan
            status pembayaran, serta masa langganan. Detail kartu atau
            rekeningmu diproses oleh Midtrans dan tidak disimpan oleh
            TemanTumbuh.
          </li>
          <li>
            <strong>Data teknis:</strong> data sesi login, alamat IP, dan
            informasi browser/perangkat untuk menjaga keamanan akun.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "penggunaan",
    title: "Cara kami menggunakan data",
    content: (
      <ul>
        <li>Membuat, memverifikasi, dan mengamankan akunmu.</li>
        <li>
          Menjalankan fitur seperti mood check-in, diary, insight, dan Brave
          Choice.
        </li>
        <li>
          Menyesuaikan pengalaman berdasarkan data profil dan jawaban awalmu.
        </li>
        <li>
          Mengirim email penting, seperti verifikasi akun, reset password,
          permintaan persetujuan orang tua, dan laporan mingguan.
        </li>
        <li>Memproses pembayaran dan mengelola status langganan.</li>
        <li>
          Mendeteksi situasi yang mungkin berisiko bagi keselamatanmu (lihat
          bagian Keamanan dan deteksi risiko).
        </li>
      </ul>
    ),
  },
  {
    id: "ai",
    title: "Pemrosesan dengan AI",
    content: (
      <>
        <p>
          Untuk membalas ceritamu di diary dan menyusun insight, isi pesan yang
          kamu tulis dikirim ke penyedia layanan model bahasa (AI) pihak ketiga
          untuk diproses. Respons AI dibuat secara otomatis dan bisa saja
          keliru.
        </p>
        <p>
          Ringkasan insight disusun agar tidak mengutip isi diary, nama orang,
          lokasi, atau detail pribadi lainnya.
        </p>
      </>
    ),
  },
  {
    id: "keamanan-risiko",
    title: "Keamanan dan deteksi risiko",
    content: (
      <p>
        Jika sistem mendeteksi pesan yang menunjukkan risiko terhadap
        keselamatanmu, sistem dapat membuat ringkasan peringatan yang ditinjau
        oleh admin TemanTumbuh. Tujuannya adalah membantu memastikan kamu
        mendapatkan dukungan yang tepat, bukan untuk menilai atau menghakimimu.
      </p>
    ),
  },
  {
    id: "orang-tua",
    title: "Laporan untuk orang tua/wali",
    content: (
      <>
        <p>
          Menambahkan email orang tua atau wali bersifat opsional. Saat email
          ditambahkan, kami mengirim permintaan persetujuan ke alamat tersebut.
          Laporan hanya dikirim setelah orang tua/wali menyetujuinya.
        </p>
        <p>
          Laporan berisi ringkasan emosi mingguan dan <strong>tidak</strong>{" "}
          menyertakan isi diary. Kamu dapat mengubah atau menghapus email orang
          tua/wali kapan saja melalui{" "}
          <Link href="/profile/parent-report">pengaturan laporan</Link>.
        </p>
      </>
    ),
  },
  {
    id: "pihak-ketiga",
    title: "Berbagi data dengan pihak ketiga",
    content: (
      <>
        <p>
          Kami <strong>tidak menjual</strong> datamu. Data hanya dibagikan
          kepada penyedia layanan yang dibutuhkan untuk menjalankan TemanTumbuh:
        </p>
        <ul>
          <li>Google, jika kamu memilih masuk dengan akun Google.</li>
          <li>Midtrans, untuk memproses pembayaran.</li>
          <li>Penyedia layanan email, untuk mengirim email dari aplikasi.</li>
          <li>Penyedia layanan AI, untuk fitur diary dan insight.</li>
          <li>Penyedia hosting dan database, untuk menyimpan data aplikasi.</li>
        </ul>
        <p>
          Kami juga dapat mengungkapkan data jika diwajibkan oleh hukum yang
          berlaku.
        </p>
      </>
    ),
  },
  {
    id: "penyimpanan",
    title: "Penyimpanan dan perlindungan data",
    content: (
      <p>
        Isi diary disimpan dalam bentuk terenkripsi. Kami menerapkan langkah
        pengamanan yang wajar untuk melindungi data lainnya, namun tidak ada
        sistem yang sepenuhnya bebas risiko. Data disimpan selama akunmu aktif
        atau selama dibutuhkan untuk menjalankan layanan.
      </p>
    ),
  },
  {
    id: "hak-pengguna",
    title: "Hak dan pilihanmu",
    content: (
      <ul>
        <li>
          Melihat dan memperbarui data profil melalui{" "}
          <Link href="/profile">halaman profil</Link>.
        </li>
        <li>Mengubah password atau membuat password untuk akun Google.</li>
        <li>Menambah, mengubah, atau menghapus email orang tua/wali.</li>
        <li>
          Meminta salinan atau penghapusan akun beserta datamu dengan
          menghubungi kami di{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </li>
      </ul>
    ),
  },
  {
    id: "usia",
    title: "Pengguna di bawah umur",
    content: (
      <p>
        TemanTumbuh ditujukan untuk usia 10–29 tahun. Jika kamu berusia di bawah
        18 tahun, kami menganjurkan kamu menggunakan TemanTumbuh dengan
        sepengetahuan orang tua atau wali. Fitur laporan orang tua tersedia
        untuk mendukung hal ini tanpa membuka isi diary-mu.
      </p>
    ),
  },
  {
    id: "perubahan",
    title: "Perubahan kebijakan",
    content: (
      <p>
        Kebijakan ini dapat diperbarui seiring perkembangan layanan. Tanggal
        pembaruan terakhir selalu tercantum di bagian atas halaman ini.
        Perubahan penting akan kami informasikan melalui aplikasi atau email.
      </p>
    ),
  },
  {
    id: "kontak",
    title: "Hubungi kami",
    content: (
      <p>
        Pertanyaan atau permintaan terkait privasi dapat dikirim ke{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Kebijakan Privasi"
      title={
        <>
          Ceritamu tetap <em>milikmu.</em>
        </>
      }
      intro="Kami ingin kamu merasa aman saat bercerita. Halaman ini menjelaskan data apa yang kami simpan, untuk apa, dan bagaimana kamu bisa mengendalikannya."
      lastUpdated="18 Oktober 2026"
      sections={sections}
      related={{
        href: "/terms",
        label: "Syarat & Ketentuan",
        text: "Baca juga aturan penggunaan layanan di",
      }}
    />
  );
}
