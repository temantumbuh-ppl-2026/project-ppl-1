# TemanTumbuh

TemanTumbuh adalah aplikasi web pendamping kesehatan mental dan keamanan anak/remaja. Aplikasi ini membantu pengguna mencatat suasana hati, bercerita lewat diary berbantuan AI, mengenali pilihan aman melalui kuis BraveChoice, serta mendapatkan insight harian untuk akun premium.

Project ini dibangun sebagai aplikasi **Next.js App Router** dengan **Prisma + PostgreSQL**, autentikasi **better-auth**, integrasi AI untuk TemanCerita/Insight, pembayaran premium via **Midtrans**, dan automated test memakai **Vitest** serta **Playwright**.

## Fitur Utama

- **Autentikasi dan onboarding**: register, login, reset password, Google OAuth, proteksi route, dan redirect setelah login berdasarkan status profil.
- **Baseline assessment**: pertanyaan awal untuk membaca kondisi pengguna menggunakan model ONNX lokal.
- **Mood check-in**: pencatatan mood harian, catatan singkat, dan streak.
- **TemanCerita**: diary berbasis chat dengan AI, penyimpanan pesan, dan enkripsi konten sensitif.
- **Brave Choice**: kuis pilihan aman untuk edukasi pencegahan kekerasan/bullying dengan kuota harian untuk user gratis.
- **Insight premium**: ringkasan pola mood dan rekomendasi aksi berdasarkan data mood serta diary.
- **Subscription dan payment**: pembelian premium, status langganan, pembatalan pembayaran pending, dan webhook Midtrans.
- **Admin dashboard**: ringkasan platform, daftar user, dan manajemen pertanyaan BraveChoice.

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling/UI**: Tailwind CSS 4, shadcn-style components, Radix UI, Framer Motion
- **Database/ORM**: PostgreSQL, Prisma 7
- **Auth**: better-auth
- **AI/ML**: OpenAI-compatible API client, ONNX Runtime
- **Payment**: Midtrans Snap
- **Email**: Nodemailer SMTP
- **Testing**: Vitest, Testing Library, Playwright
- **Tooling**: ESLint, Prettier, Husky, lint-staged

## Struktur Folder

| Path | Keterangan |
| --- | --- |
| `src/app` | Next.js routes, layouts, pages, API routes, dan generated Prisma client. |
| `src/components` | Komponen UI umum, layout, auth, admin, mood, settings, dan landing page. |
| `src/features` | Modul fitur berbasis domain seperti diary, home dashboard, dan insight. |
| `src/lib` | Service layer, validasi, auth helper, encryption, payment, dan email. |
| `src/models` | Model ONNX untuk baseline inference. |
| `prisma` | Schema, migration, dan seed database. |
| `tests` | Unit, API/integration-style, NFR, dan Playwright E2E tests. |
| `docs` | Dokumentasi API, testing, NFR, RTM, dan dokumen pendukung. |
| `public/img` | Logo, ilustrasi, emoji mood, dan asset landing page. |
| `scripts` | Script utilitas project, misalnya set admin user. |

## Prasyarat

- Node.js yang kompatibel dengan project.
- Corepack aktif untuk menjalankan pnpm.
- PostgreSQL/Supabase database.
- Browser Playwright bila ingin menjalankan E2E test.

Aktifkan pnpm jika belum tersedia:

```bash
corepack enable
```

## Setup Lokal

1. Install dependency.

```bash
corepack pnpm install
```

2. Salin environment variable dari `.env.example` ke `.env`, lalu isi nilainya.

```bash
cp .env.example .env
```

3. Generate Prisma client.

```bash
corepack pnpm generate
```

4. Jalankan migration/seed sesuai kebutuhan database lokal.

```bash
corepack pnpm prisma migrate dev
corepack pnpm tsx prisma/seed.ts
```

5. Jalankan development server.

```bash
corepack pnpm dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

## Migration Penghapusan Fitur Orang Tua

Migration `20261119000000_remove_parent_features` menghapus tabel `parent`, kolom `user.parentEmail`, dan enum khusus consent/report. API, server action, serta cron laporan orang tua sudah dihapus. Email verifikasi akun dan reset password tetap digunakan.

Sebelum menerapkan migration pada database existing, hentikan deployment lama dan scheduler yang masih mengakses fitur tersebut, buat backup database di lokasi privat di luar repository, lalu verifikasi backup dapat direstore ke database percobaan. Jangan mengandalkan rollback migration untuk mengembalikan data yang dihapus.

Setelah backup terverifikasi, terapkan migration melalui `corepack pnpm prisma migrate deploy` dengan `DIRECT_URL` menunjuk database tujuan, lalu jalankan versi aplikasi yang sesuai. Proses update kode atau `prisma generate` saja tidak menerapkan migration ke database. Riwayat migration lama dipertahankan.

## Environment Variable

| Variable | Keterangan |
| --- | --- |
| `DATABASE_URL` | URL database PostgreSQL utama, biasanya connection pooling Supabase. |
| `DIRECT_URL` | URL direct database untuk migration. |
| `BETTER_AUTH_SECRET` | Secret untuk session/auth. |
| `BETTER_AUTH_URL` | Base URL aplikasi untuk auth callback. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Credential Google OAuth. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | Konfigurasi pengiriman email. |
| `API_KEY`, `BASE_URL` | Credential dan base URL provider LLM OpenAI-compatible. |
| `ENCRYPTION_KEY` | Key enkripsi untuk konten TemanCerita. |
| `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION` | Konfigurasi Midtrans Snap. |

## Script Penting

```bash
corepack pnpm dev            # menjalankan Next.js dev server
corepack pnpm build          # production build
corepack pnpm start          # menjalankan hasil build
corepack pnpm lint           # ESLint
corepack pnpm test           # Vitest unit/API/NFR tests
corepack pnpm test:coverage  # Vitest dengan coverage threshold
corepack pnpm test:e2e       # Playwright E2E tests
corepack pnpm format:check   # cek format Prettier
corepack pnpm format:write   # format file
```

## Testing

Detail struktur test ada di `tests/README.md`.

Ringkasnya:

- `corepack pnpm test` menjalankan Vitest untuk API route, service, helper, validation, dan NFR lokal.
- `corepack pnpm test:e2e` menjalankan Playwright pada Chromium, WebKit, dan mobile Chrome.
- `corepack pnpm test:coverage` mengecek coverage untuk file-file kritis yang sudah didefinisikan di `vitest.config.mts`.

## Dokumentasi

- `docs/API_docs.md`: dokumentasi endpoint API.
- `docs/functional-testing.csv`: skenario pengujian fungsional.
- `docs/unit-testing.csv`: daftar automated unit/service/API test.
- `docs/non-functional-testing.md`: ringkasan pengujian NFR.
- `docs/requirement-traceability-matrix.md`: keterlacakan requirement ke implementasi dan test.

## Catatan Sebelum Push

- Jangan commit `.env`, `.next`, `node_modules`, `coverage`, `playwright-report`, `test-results`, `*.tsbuildinfo`, atau generated Prisma client.
- Jalankan minimal `corepack pnpm lint`, `corepack pnpm test`, dan `corepack pnpm build`.
- Jalankan `corepack pnpm test:e2e` bila perubahan menyentuh route, auth guard, UI, middleware/layout, atau flow browser.
