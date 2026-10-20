# TemanTumbuh — Design Guideline (Frontend)

Dokumen ini merangkum keputusan desain yang diterapkan selama redesign: halaman
marketing, Login/Register, Syarat & Ketentuan / Kebijakan Privasi, Dashboard
(`/home`), Brave Choice, dan Diary (TemanCerita). Gunakan sebagai acuan untuk
semua pekerjaan FE berikutnya, termasuk halaman yang belum di-redesign
(Insight, Subscription, Profil, Admin, Mood, Baseline).

> Sumber kebenaran ada di kode. Rujukan utama:
> `src/app/globals.css` (token PB20), `src/components/landing/home/landing-redesign.css`
> (tema landing), `src/lib/mood/palette.ts` (palet mood), dan stylesheet per halaman
> yang disebut di Bagian 9.

---

## 1. Prinsip

1. **Hangat, suportif, tidak menghakimi.** Remaja adalah pengguna utama. UI tidak
   boleh terasa seperti ujian atau peringatan.
2. **Tanpa merah.** Kesalahan dan peringatan memakai warna *attention* (clay) atau
   *warning* (cream), dibedakan lewat ikon + teks + border, bukan warna saja.
3. **Fungsi existing dulu, tampilan kemudian.** Redesign tidak boleh mengubah
   logika, API, kontrak data, aturan paket, atau alur auth.
4. **Data kosong ≠ netral.** Hari tanpa mood adalah "Belum dicatat", bukan skor 3
   atau 0. Hari mendatang "Belum tiba". Jangan menampilkan data demo.
5. **Gaya terisolasi.** Setiap halaman redesign punya scope CSS sendiri agar tidak
   merusak halaman lain.
6. **Dapat dipakai semua orang.** Target sentuh ≥ 44px, teks ≥ 12px, fokus
   keyboard terlihat, `prefers-reduced-motion` dihormati.

## 2. Dua lapisan sistem desain

| Lapisan | Dipakai di | Cara pakai |
|---|---|---|
| **Token PB20** (`--tt-*`) | komponen shadcn (`Button`, `Input`, `Select`, `Alert`, `Label`), form umum, halaman yang belum di-redesign, shell dashboard | Tailwind utility (`bg-tt-surface`, `rounded-tt-md`, `tt-text-body`) atau `var(--tt-…)` |
| **Tema Landing/Redesign** (`.tt-landing`, lalu scope halaman) | marketing, auth, legal, dashboard, diary, Brave Choice | variabel lokal (`--teal-dark`, `--mint`, dst.) di dalam scope halaman |

Aturan: **jangan mengubah token global** untuk kebutuhan satu halaman. Tambahkan
variabel di scope halaman tersebut. Jika sebuah warna dipakai ≥ 3 halaman, baru
usulkan menjadi token global.

## 3. Tipografi

### 3.1 Font (dimuat di `src/app/layout.tsx` lewat `next/font`)

| Peran | Font | Variabel CSS | Dipakai untuk |
|---|---|---|---|
| Teks UI | **Plus Jakarta Sans** 400–800 | `--font-plus-jakarta` / `--tt-font-sans` | body, label, tombol, input, kartu |
| Judul | **Fraunces** (varian display, bobot 700) | `--font-fraunces-display`, `--font-fraunces` | `h1`–`h3`, angka besar, judul kartu |
| Aksen tulisan tangan | **Caveat** 600–700 | `--font-caveat` | kata `em` di judul, label kecil dekoratif ("selamat datang lagi", "langkah pertama") |

Fallback selalu: `"Fraunces", Georgia, serif` dan `"Caveat", cursive`.

### 3.2 Aturan

- **Ukuran minimum 12px** di seluruh UI (sebelumnya ada 6–11px; sudah dinaikkan).
- Judul memakai `font-weight: 700`, `letter-spacing` negatif (−0.03 s/d −0.055em),
  `line-height` rapat (1.0–1.15 untuk judul besar).
- Kata penekanan di judul dibungkus `<em>` → otomatis Caveat berwarna teal:
  `Senang kamu <em>kembali.</em>`
- Teks isi 13–15px dengan `line-height` 1.55–1.75. Input 15px (16px di mobile
  agar iOS tidak zoom).
- Label kecil kapital (kicker): 12px, `font-weight: 800`, `letter-spacing: .12–.16em`,
  `text-transform: uppercase`, warna `--teal-dark`.

### 3.3 Skala yang dipakai

| Elemen | Ukuran | Bobot | Font |
|---|---|---|---|
| Judul hero marketing | `clamp(50px, 5.5vw, 76px)` | 700 | Fraunces |
| H1 halaman auth / sapaan dashboard | 35px → 49px (clamp) | 700 | Fraunces |
| H1 header Diary | 25px (19px mobile) | 700 | Fraunces |
| H2 seksi | 24–34px | 700 | Fraunces |
| Judul kartu fitur | 19–20px | 700 | Fraunces |
| Angka statistik | 30–59px | 700 | Fraunces |
| Body | 14–16px | 400–500 | Jakarta |
| Label form | 13px | 800 | Jakarta |
| Tombol | 13–15px | 800 | Jakarta |
| Caption / hint / error | 12px | 500–700 | Jakarta |

Token PB20 untuk halaman non-redesign: `--tt-text-display/h1/h2/h3/body-lg/body/label/caption/button`
(utility `tt-text-*`).

## 4. Warna

### 4.1 Palet tema redesign

| Nama | Hex | Pemakaian |
|---|---|---|
| Navy | `#13263E` | teks utama, judul |
| Teal | `#10A89A` | aksen, aksi sekunder, aksen `em` |
| **Teal dark** | `#087F76` | **warna aksi utama** (tombol, link, tanda terpilih) — kontras ≥ 4.5:1 dengan putih |
| Teal dark hover | `#066A63` | hover tombol primer |
| Mint | `#DFF7EE` | latar feedback suportif, ring fokus, badge |
| Mint light | `#F0FBF7` | latar kartu lembut, kartu aktif |
| Paper | `#FBFAF6` | latar halaman marketing |
| Paper diary | `#FFFDF7` | latar halaman buku Diary |
| Yellow | `#FFDC72` | dekor, ikon streak |
| Peach | `#FFC5AD` | dekor, ikon Brave Choice, penanda halaman |
| Lilac | `#DCD3FF` | ikon Insight, aksen |
| Sky | `#DDECFF` | gradien latar |
| Cream / butter | `#FFF8DF` (border `#F1DFA2`) | catatan, kuota habis, premium |
| Garis | `#CADBD7` / `#CFE0DC` | border kartu |
| Teks sekunder | `#5C6D79` – `#66757D` | deskripsi, caption (kontras ≥ 4.5:1) |

### 4.2 Warna semantik (tanpa merah)

| Kondisi | Token | Hex | Catatan |
|---|---|---|---|
| Error / perhatian | `--tt-attention-bg / -text / -border` | `#FBEFE6` / `#8A4A1F` / `#EBD2BF` | **pengganti merah**; selalu sertakan ikon + teks |
| Peringatan / premium | `--tt-warning-bg / -text` | `#FEF5D4` / `#7A5200` | kuota, batas paket |
| Sukses | `--tt-success-bg / -text` | `#D8F5E8` / `#1A5C36` | status "Aktif", "Terverifikasi" |
| Info | `--tt-info-bg / -text` | `#E4F2FC` / `#1A4E75` | informasi netral |

**Dilarang:** `#ef4444`, `#dc2626`, `red`, atau tint merah apa pun di UI pengguna.
Tombol *Keluar* dan aksi destruktif lain memakai warna *attention* (clay) + ikon.
Catatan: shell sidebar lama (`app-sidebar-shell.tsx`) dan beberapa halaman yang belum
di-redesign masih memakai `#DC2626` pada *Keluar* — ganti saat disentuh.

### 4.3 Palet mood (`src/lib/mood/palette.ts`) — jangan diubah per-halaman

| Skor | Label | Stroke | Latar |
|---|---|---|---|
| 1 | Sangat Sedih | `#2B6CB0` (biru) | `rgba(43,108,176,.12)` |
| 2 | Sedih | `#7C5CBF` (ungu) | `rgba(124,92,191,.12)` |
| 3 | Biasa Aja | `#2A7A74` (teal) | `rgba(42,122,116,.12)` |
| 4 | Senang | `#3B8318` (hijau) | `rgba(59,131,24,.12)` |
| 5 | Sangat Senang | `#A86500` (amber) | `rgba(168,101,0,.12)` |

Ramp dingin → hangat, tanpa merah. Selalu impor `MOOD_COLORS` / `getMoodColor` /
`MoodFaceIcon` / `getMoodLabel`; jangan menulis ulang hex-nya. Kartu hari yang
terisi memakai warna mood sendiri (gradien putih → tint 22%, border 35%).
Level Baseline: Beginner = teal (skor 3), Intermediate = amber (skor 5).

## 5. Bentuk, jarak, bayangan

- **Radius khas "kartu halaman"**: sudut tidak simetris `7px 28px 7px 28px`
  (kartu besar), `6px 22px 6px 22px` (mobile), `24px 7px 24px 7px` (banner sapaan),
  `20px 6px 20px 6px` (hero). Elemen kecil: 9–12px. Pil: 999px.
- **Bayangan keras (offset mint)** untuk kartu utama:
  `13px 14px 0 var(--mint), 0 22px 50px rgba(19,38,62,.11)`; mobile `7px 8px 0 var(--mint)`.
  Kartu biasa: `0 7px 20px rgba(19,38,62,.04)`.
- **Border** 1px `#C9DFDA`; elemen terpilih 2px `--teal-dark` + ring `0 0 0 3px var(--mint)`.
- **Dekorasi** (opsional, `aria-hidden`, `pointer-events:none`): lingkaran tebal
  kuning/peach, doodle panah peach, bintang, penanda halaman peach (Diary).
- Grid jarak: kelipatan 4/8px; padding kartu 22–38px desktop, 18–22px mobile.

## 6. Komponen & tombol

### 6.1 Varian tombol

| Varian | Spesifikasi | Dipakai untuk |
|---|---|---|
| **Primer** | bg `#087F76`, teks putih, tinggi 52px (dashboard 48px), radius 11px, bobot 800, bayangan `0 7px 0 rgba(7,105,98,.12)`, hover naik 2px + `#066A63` | aksi utama satu per tampilan |
| **Sekunder / outline** | bg putih, border `#A9D6CF` 1px, teks teal-dark, hover bg mint-light | aksi pendamping (Kembali, Ganti email) |
| **Google** | bg putih, border `#A9D6CF`, ikon Google existing, tinggi 52px | masuk/daftar Google |
| **Premium** | bg `#FFF0B5`, border cream, teks `#5B4600`, ikon mahkota/gembok | upgrade, konten terkunci — **bukan** tombol mati |
| **Ghost / link** | teks teal-dark 800, garis bawah 3px offset | Lupa password?, Daftar Gratis, tautan legal |
| **Ikon** | 44×44px, radius 10px, border `#C7DDD8`, bg putih | prev/next, tutup, ciutkan sidebar |
| **Chip topik / starter** | tinggi 44px, pil, border `#AFD8D1`, teks teal-dark, hover bg teal-dark | pilihan awal cerita |
| **Disabled** | teks `#8D999D`, bg `#EDF2F1`, `cursor:not-allowed` (atau `wait` saat memuat) | submit kosong/loading |

Aturan tombol: tombol submit tidak boleh bisa diklik ganda (disabled + spinner +
`aria-busy`); tombol tampil/sembunyikan password `type="button"`; jangan membuat
tombol tanpa aksi nyata; tautan navigasi pakai `<Link>`, aksi pakai `<button>`.

### 6.2 Katalog tombol per halaman

| Halaman | Teks tombol | Fungsi |
|---|---|---|
| Login | **Masuk** · Masuk dengan Google · Lupa password? · Daftar Gratis | `signIn.email` / `signIn.social` / `/forgot-password` / `/register` |
| Register 1 | **Daftar & Verifikasi** · Daftar dengan Google · Masuk | `signUp.email` / Google / `/login` |
| Verifikasi email | **Kirim Ulang Verifikasi** (jeda 30 dtk) · Ganti email | `sendVerificationEmail` / kembali ke form |
| Register 2–3 | **Lanjut** · Kembali ke akun · **Selesai** · Kembali | alur existing `completeProfile=1` |
| Dashboard | **Mulai Bercerita** → `/diary` | TemanCerita |
| Dashboard riwayat | ‹ › (Minggu sebelumnya/berikutnya) · pemilih bulan · **Kembali ke hari ini** · Coba lagi | navigasi periode |
| Brave Choice (kartu) | **Jelajahi Pilihan** / **Coba Skenario Lain** | buka modal |
| Insight (kartu) | **Lihat Insight** (premium) · **Buka dengan Premium** (gratis) | `/insight` / `/subscription` |
| Baseline (kartu) | **Mulai refleksi** / **Kerjakan kembali** | `/baseline` |
| Brave Choice (modal) | **Coba Skenario Lain** · **Kembali ke Dashboard** / **Lanjutkan Menulis** · Lihat Premium · Ulangi dari Awal · Lewati situasi ini · Coba lagi · Tutup Brave Choice | sesuai kuota & asal pembukaan |
| Diary sidebar | Kembali · Ciutkan riwayat diary · ‹ › bulan · **Hari Ini** · Brave Choice · Upgrade Premium | `useDiary` / `useBraveChoice` |
| Diary percakapan | Riwayat · Entry sebelumnya/berikutnya · starter · **Kirim pesan** · Upgrade → · Muat ulang diary | `handleSendMessage` dst. |
| Legal | Syarat & Ketentuan · Kebijakan Privasi | `/terms` · `/privacy` |

### 6.3 Form

- Input & select: tinggi 52px, radius 11px, border `#CBDED9`, teks navy 15px.
- Fokus: border `--teal-dark` + ring `0 0 0 4px var(--mint)`. Tombol/link fokus:
  outline 3px `--teal-dark`, offset 3px.
- Error: border + latar *attention*, pesan 12px bobot 700 di bawah field dengan ikon
  (`aria-describedby`, `aria-invalid`, `role="alert"`), **tanpa merah**.
- Label di atas field, 13px/800. Field opsional diberi badge mint "Opsional".
- Password: gunakan komponen `PasswordInput` existing; `autocomplete`
  (`email`, `current-password`, `new-password`, `name`) wajib benar.
- Enter harus men-submit form; spinner + teks "Memproses..." saat loading.

### 6.4 Stepper registrasi

3 langkah "Akun · Data Diri · Laporan", lingkaran 34px; selesai = teal-dark + centang,
aktif = border teal-dark + ring mint. Mobile menambah "Langkah N dari 3".
Stepper hanya maju setelah tahap benar-benar valid (verifikasi email tidak boleh
dilewati; `completeProfile=1` mulai dari langkah 2).

### 6.5 Alert, badge, status

- Alert error: kotak *attention* + ikon info + judul ("Login gagal", "Pendaftaran
  gagal") + deskripsi.
- Badge status 12px/800 kapital: netral abu, **Premium** kuning, **Aktif/Terverifikasi** hijau muda.
- Catatan/kuota habis: kotak cream + ikon info (bukan segitiga merah).

## 7. Pola layout per halaman

| Halaman | Pola |
|---|---|
| Marketing | Header/Footer bersama, `.shell` lebar 1180px, seksi dengan `.eyebrow`/`.kicker`, animasi masuk |
| Auth | 2 kolom: panel visual (kiri, dekor catatan + mood) + kartu form (kanan 440–480px); mobile: form dulu, panel diringkas di bawah |
| Legal | Hero + kotak "Draf untuk ditinjau" + daftar isi sticky (desktop) + seksi bernomor |
| Dashboard `/home` | Shell sidebar existing + top bar; urutan: sapaan → ringkasan aktivitas (panel teal + statistik) → riwayat perasaan (7 hari) → fitur pendukung (3 kartu satu baris) |
| Brave Choice | Modal: header mint + ikon kompas peach, kartu "Situasinya", dua pilihan, feedback mint; mobile = bottom sheet |
| Diary | Grid: sidebar riwayat (80% skala, 248px) + percakapan penuh; header/thread/composer **sejajar** (padding kiri 32px, kanan 56px); tepi buku, penanda halaman, latar bergaris |

Breakpoint: **≤ 980px** (sidebar → drawer, header membungkus), **≤ 720px**
(mobile), **≤ 390px** (sangat sempit). Dashboard memakai *container query*
(`container: dash / inline-size`) karena lebarnya bergantung pada sidebar shell.

## 8. Copywriting

### 8.1 Gaya bahasa

- Bahasa Indonesia, sapaan **"kamu"**, nada hangat dan sederhana; hindari istilah
  teknis dan kalimat menggurui.
- Tombol: kata kerja singkat (Masuk, Lanjut, Selesai, Mulai Bercerita). Hindari
  huruf kapital semua kecuali badge kecil.
- Jangan menjanjikan hasil pasti; jelaskan risiko dengan jelas bila relevan.
- Tampilkan **angka dengan makna jujur**: "3 latihan diselesaikan" (bukan
  "3 skenario unik") karena skenario bisa berulang.

### 8.2 Istilah baku

| Pakai | Jangan |
|---|---|
| **TemanCerita** (satu kata) untuk fitur diary/AI | Buddy, AI Companion, Safe Diary di UI |
| **Brave Choice** | Brave Choice Quiz, soal, kuis |
| **Refleksi Awal** (judul) + "Baseline Assessment" (anak judul) | — |
| **Streak check-in mood** / "Streak N hari" | "hari mencatat" (menyesatkan) |
| **Riwayat Diary**, **Riwayat perasaan** | History |
| **Pelan-pelan tetap berarti.** (penutup suportif) | kata motivasi menekan |

### 8.3 Pesan sistem yang sudah baku

| Situasi | Teks |
|---|---|
| Login gagal | "Email atau password tidak valid." |
| Email belum terverifikasi | "Email belum terverifikasi. Silakan cek inbox/spam untuk verifikasi." |
| Terlalu banyak percobaan | "Terlalu banyak percobaan login. Coba lagi beberapa saat." |
| Verifikasi dikirim | "Link verifikasi sudah dikirim ke … " + tombol kirim ulang |
| Riwayat mood gagal | "Riwayat mood gagal dimuat. Coba lagi untuk melihat catatanmu." |
| Hari kosong | "Belum dicatat" / "Tidak ada check-in mood pada tanggal ini. Tidak apa-apa—kamu bisa mulai lagi kapan saja." |
| Hari mendatang | "Belum tiba" |
| Skenario gagal | "Skenario belum berhasil dimuat. Coba lagi." |
| Pilihan belum tersimpan | "Pilihanmu belum tersimpan. Coba pilih lagi." |
| Pesan diary gagal | "Pesan belum terkirim. … Ceritamu masih ada di kolom tulis. Kirim lagi untuk mencoba." |
| Kuota Brave Choice habis | "Kesempatan hari ini sudah habis. Kamu bisa menjelajahi situasi baru lagi besok…" |
| Sisa kuota | "Sisa kesempatan hari ini: 3" · "3 kesempatan tersisa hari ini" |
| Batas sesi diary | "Batas 15 sesi diary bulan ini tercapai. Upgrade ke Premium untuk menulis tanpa batas." |
| Diary lampau | "Entri lampau tidak bisa diedit - pilih Hari Ini untuk menulis baru." |
| Placeholder diary | "Tulis ceritamu di sini..." |

### 8.4 Pola feedback Brave Choice (3 langkah)

1. **Pahami** perasaan/niat: "Wajar kalau kamu ingin masalahnya cepat selesai."
   (dipilih per kategori; tetap memvalidasi perasaan, bukan membenarkan tindakan berisiko).
2. **Langkah yang disarankan**: teks opsi rekomendasi dari bank soal.
3. **Alasan / yang perlu diperhatikan**: penjelasan dari bank soal.

Judul hasil: "Ada langkah lain yang bisa kamu coba" atau "Langkah ini bisa
membantumu". Pilihan pengguna diberi label **"Pilihanmu"** (border teal), bukan
benar/salah.

**Kata & elemen terlarang di UI:** benar/salah, "kurang tepat", "coba pikirkan lagi",
"bijak" (sebagai label pilihan), persentase ketepatan/akurasi, grafik lingkaran
akurasi, tanda silang, warna merah. (Logika penilaian internal & statistik di
database tetap ada; hanya penyajiannya yang berubah.)

### 8.5 Legal

Halaman Syarat & Ketentuan / Kebijakan Privasi berisi **draf yang belum ditinjau
hukum** dan memuat kotak penanda "Draf untuk ditinjau". Jangan menulis klaim hukum
yang tidak sesuai perilaku aplikasi (mis. refund — saat ini "belum ditetapkan").

## 9. Struktur & isolasi CSS

| Area | Scope | File |
|---|---|---|
| Landing/Marketing | `.tt-landing` | `components/landing/home/landing-redesign.css` (+ per halaman) |
| Login/Register | `.tt-landing.tt-auth-redesign` | `components/auth/redesign/auth-redesign.css` |
| Legal | `.tt-landing.legal-page` | `components/landing/legal/legal-redesign.css` |
| Dashboard | `.tt-dash` (+ container `dash`) | `features/home/components/home-dashboard-redesign.css` |
| Brave Choice | `.bc-overlay` (modal di-*portal* ke `body`) | `features/diary/components/brave-choice.css` |
| Diary | `.tt-diary` (prefix kelas `dy-`) | `features/diary/components/diary-redesign.css` |

Aturan:
- Semua selector berada di dalam scope; **jangan** menulis `button {}` / `h1 {}` global.
- Nama kelas berprefiks halaman (`dy-`, `bc-`, `dash-`, `support-`).
- Gunakan kembali komponen existing (`Button`, `Input`, `PasswordInput`, `Select`,
  `Alert`, `AuthField`, `CalendarDropdown`, `MoodFaceIcon`, `PageLoader`,
  `LogoutConfirmDialog`). Bila perlu mengubah tampilannya di satu halaman,
  override lewat selector berskop (mis. `.tt-diary .dy-date-picker button`).
- Logo resmi: `/img/LOGO_TEMANTUMBUH.svg` (via `next/image`).
- Sidebar Diary memakai `zoom: 0.8` (desktop saja) agar kompak; di ≤ 980px kembali 1.

## 10. Aksesibilitas & interaksi

- Target sentuh ≥ 44×44px untuk semua tombol, ikon, dan chip.
- Fokus terlihat di semua kontrol; modal: fokus masuk ke dialog, terkunci (Tab),
  Escape menutup, fokus kembali ke pemicu.
- Gunakan `role="status"` / `aria-live="polite"` untuk loading dan hasil dinamis,
  `role="alert"` untuk error, `aria-pressed`/`aria-current` untuk pilihan aktif.
- Hari/tanggal diberi `aria-label` lengkap ("Selasa, 13 Oktober 2026: Biasa Aja").
- Status tidak boleh hanya warna: selalu ikon/teks/border (mis. hari mendatang =
  garis diagonal + "Belum tiba").
- Animasi lembut (naik 2px saat hover, fade/slide ≤ 0.4s); semua dimatikan atau
  diperlambat dengan `prefers-reduced-motion`.
- Mobile: input 16px, composer menghormati `env(safe-area-inset-bottom)`, tidak ada
  horizontal scroll.

## 11. State data

| State | Aturan |
|---|---|
| Loading | `PageLoader` untuk halaman; spinner kecil + teks untuk bagian ("Memuat percakapan…") |
| Kosong | hanya bila data memang kosong; teks suportif + langkah berikutnya |
| Error | pesan jelas + tombol "Coba lagi"; jangan mengganti dengan state kosong |
| Terkunci/paket | kotak cream + ajakan Premium; tautan nyata ke `/subscription` |
| Read-only | ikon gembok + "Hanya baca"; input diganti pesan penjelas |

## 12. Checklist sebelum membuat PR FE

- [ ] Font ≥ 12px, hanya Jakarta/Fraunces/Caveat sesuai perannya.
- [ ] Tidak ada warna merah; error memakai *attention*, peringatan memakai cream.
- [ ] Warna mood diambil dari `MOOD_COLORS`.
- [ ] Gaya berada di scope halaman; halaman lain tidak berubah.
- [ ] Tombol ≥ 44px, ada fokus, tidak ada tombol tanpa aksi, submit anti-ganda.
- [ ] Copy mengikuti Bagian 8 (istilah baku, nada suportif).
- [ ] Loading/kosong/error/sukses semuanya ditangani.
- [ ] Desktop, tablet (768px), mobile (375px) tanpa horizontal overflow.
- [ ] Logika/API/payload tidak berubah; tes terkait diperbarui.
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` lulus.
- [ ] Setelah PR di-merge lalu di-*revert*, jangan membuka PR baru dari branch yang
      sama (git menganggapnya sudah ter-merge); buat branch baru dari `dev` dan
      batalkan revert-nya.

## 13. Utang desain yang masih ada

- Halaman **Insight, Subscription, Profil, Pengaturan, Mood, Baseline, Admin**
  belum memakai tema redesign; masih token PB20 dan banyak style inline.
- `src/features/diary/constants/tokens.ts` masih menyimpan alias warna lama
  (dipakai komponen yang belum diubah); hapus bertahap.
- Beberapa tampilan masih memakai `isMobile`/style inline — pindahkan ke CSS berskop
  saat disentuh berikutnya.
- Tes e2e visual (screenshot) belum ada; saat ini verifikasi visual dilakukan manual.
