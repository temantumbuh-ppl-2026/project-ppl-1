export type HomeMood = {
  label: string;
  icon: string;
  activeIcon: string;
};

export type HomeFeatureItem = {
  icon: "spark" | "heart" | "chart";
  title: string;
  text: string;
  color: "peach" | "lilac" | "sky";
};

export type HomeValueItem = {
  title: string;
  text: string;
  icon: "shield" | "people" | "compass";
};

// Urutan dari paling berat ke paling senang, memakai aset mood existing.
export const homeMoods: HomeMood[] = [
  {
    label: "Berat",
    icon: "/img/Emojis/FaceVerySad.png",
    activeIcon: "/img/Emojis/VerySadActive.png",
  },
  {
    label: "Kurang oke",
    icon: "/img/Emojis/FaceSad.png",
    activeIcon: "/img/Emojis/SadActive.png",
  },
  {
    label: "Biasa",
    icon: "/img/Emojis/FaceNeutral.png",
    activeIcon: "/img/Emojis/NeutralActive.png",
  },
  {
    label: "Baik",
    icon: "/img/Emojis/FaceHappy.png",
    activeIcon: "/img/Emojis/HappyActive.png",
  },
  {
    label: "Senang",
    icon: "/img/Emojis/FaceVeryHappy.png",
    activeIcon: "/img/Emojis/VeryHappyActive.png",
  },
];

// Foto kolase mengikuti desain referensi.
export const homePhotos = {
  friends:
    "https://images.unsplash.com/photo-1677152951816-83cc8ff220fa?auto=format&fit=crop&w=900&q=85",
  girls:
    "https://images.unsplash.com/photo-1746106360686-aa1535588c01?auto=format&fit=crop&w=900&q=85",
  portrait:
    "https://images.unsplash.com/photo-1583302111248-e8f8863c5843?auto=format&fit=crop&w=700&q=85",
} as const;

export const homeMarqueeMessages = [
  "Kenali perasaanmu",
  "Tulis tanpa takut dihakimi",
  "Tumbuh dengan caramu",
] as const;

export const homeDiaryPoints = [
  "Prompt menulis yang suportif",
  "Catat mood bersama ceritamu",
  "Lihat kembali perjalananmu",
] as const;

export const homeFeatureItems: HomeFeatureItem[] = [
  {
    icon: "spark",
    title: "Brave Choice Simulator",
    text: "Latih pilihanmu lewat skenario ringan sebelum menghadapi situasi nyata.",
    color: "peach",
  },
  {
    icon: "heart",
    title: "Mood Check-in",
    text: "Kenali perubahan suasana hati lewat check-in singkat setiap hari.",
    color: "lilac",
  },
  {
    icon: "chart",
    title: "Insight Dashboard",
    text: "Lihat pola perjalananmu dan pahami hal-hal yang membuatmu bertumbuh.",
    color: "sky",
  },
];

export const homeValueItems: HomeValueItem[] = [
  {
    title: "Ruang yang aman",
    text: "Privasi untuk bercerita dengan lebih nyaman.",
    icon: "shield",
  },
  {
    title: "Dukungan keluarga",
    text: "Jembatan komunikasi yang lebih sehat dan terbuka.",
    icon: "people",
  },
  {
    title: "Berbasis riset",
    text: "Dirancang dari pendekatan psikologi positif dan perilaku.",
    icon: "compass",
  },
];

// Testimoni contoh dari desain referensi, belum testimoni terverifikasi.
export const homeTestimonial = {
  name: "Ayla Putri",
  role: "Pelajar SMA, 16 tahun",
  quote:
    "TemanTumbuh benar-benar membantu aku memahami perasaanku. Sekarang aku punya ruang untuk berhenti sebentar dan jujur sama diri sendiri.",
} as const;
