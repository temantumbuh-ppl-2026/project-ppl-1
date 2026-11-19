export type HomeFeatureItem = {
  iconSrc: string;
  title: string;
  description: string;
  badge: string;
};

export type HomeHowTrack = {
  tag: string;
  title: string;
  bulletPoints: string[];
  ctaLabel: string;
  theme: "teal" | "gold";
};

export type HomePurposeItem = {
  title: string;
  description: string;
  tag: string;
  icon: "shield" | "users" | "brain";
};

export type HomeTestimonialItem = {
  name: string;
  role: string;
  quote: string;
};

export const heroMoodIcons = [
  "/img/Emojis/FaceVerySad.png",
  "/img/Emojis/FaceSad.png",
  "/img/Emojis/FaceNeutral.png",
  "/img/Emojis/FaceHappy.png",
  "/img/Emojis/FaceVeryHappy.png",
] as const;

export const homeFeatureItems: HomeFeatureItem[] = [
  {
    iconSrc: "/img/DigitalDiaryLogo.svg",
    title: "Digital Diary",
    description:
      "Tulis perasaan dan pikiranmu setiap hari dengan aman, privat, dan terstruktur.",
    badge: "AI-Powered",
  },
  {
    iconSrc: "/img/BraveChoiceLogo.svg",
    title: "Brave Choice Simulator",
    description:
      "Latih dirimu menghadapi situasi sosial yang sulit melalui simulasi interaktif.",
    badge: "Gamifikasi",
  },
  {
    iconSrc: "/img/MoodCheckinLogo.svg",
    title: "Mood Check-in",
    description:
      "Lacak suasana hatimu setiap hari dan kenali pola emosi dari waktu ke waktu.",
    badge: "Harian",
  },
  {
    iconSrc: "/img/InsightDashboardLogo.svg",
    title: "Insight Dashboard",
    description:
      "Visualisasi tren emosimu dan dapatkan rekomendasi yang relevan untukmu.",
    badge: "Premium",
  },
];

export const homeHowTracks: HomeHowTrack[] = [
  {
    tag: "Untuk Anak & Remaja",
    title: "Mulai dengan Diary Harian",
    bulletPoints: [
      "Tulis perasaanmu dalam 2 menit",
      "Ceritakan harimu ke AI Diary",
      "Jawab Brave Choice Tools",
      "Lihat perkembangan moodmu",
    ],
    ctaLabel: "Coba Sekarang",
    theme: "teal",
  },
  {
    tag: "Untuk Orang Tua",
    title: "Pantau dengan Laporan Khusus",
    bulletPoints: [
      "Terima undangan dari anak",
      "Akses laporan mood mingguan",
      "Pantau tren emosi tanpa mengganggu privasi diary",
    ],
    ctaLabel: "Pelajari Lebih Lanjut",
    theme: "gold",
  },
];

export const homePurposeItems: HomePurposeItem[] = [
  {
    title: "Ruang Aman",
    description:
      "Privasi penggunanya terlindungi. Diary tidak bisa diakses siapa pun tanpa izin.",
    tag: "Privasi",
    icon: "shield",
  },
  {
    title: "Dukungan Keluarga",
    description:
      "Sambungkan orang tua dengan perkembangan anak melalui laporan ringkas yang aman.",
    tag: "Keluarga",
    icon: "users",
  },
  {
    title: "Berbasis Riset",
    description:
      "Mendorong daya kognitif psikologis positif dan praktik kesehatan mental terbaik.",
    tag: "Riset",
    icon: "brain",
  },
];

export const homeTestimonialItems: HomeTestimonialItem[] = [
  {
    name: "Ayla Putri",
    role: "Pelajar SMA, 16 tahun",
    quote: "TemanTumbuh benar-benar membantu aku memahami perasaanku.",
  },
  {
    name: "Rizky Firmansyah",
    role: "Mahasiswa, 20 tahun",
    quote: "Brave Choice membantu aku buat keputusan lebih bijak.",
  },
  {
    name: "Kasandra Daud",
    role: "Ibu, Bandung",
    quote:
      "Sebagai orang tua, aku merasa tenang karena bisa memantau perkembangan anak tanpa mengganggu privasinya.",
  },
];
