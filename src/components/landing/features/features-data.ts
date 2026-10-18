// Konten halaman Fitur. Nama fitur, label mood, dan alur mengikuti aplikasi.

export type MoodScore = 1 | 2 | 3 | 4 | 5;

// Label dan urutan sama dengan Mood Check-in di aplikasi.
export const featureMoods: {
  score: MoodScore;
  label: string;
  reply: string;
}[] = [
  {
    score: 1,
    label: "Sangat Sedih",
    reply:
      "Hari ini mungkin terasa berat. Kamu boleh menulis hal yang paling membebani pikiranmu.",
  },
  {
    score: 2,
    label: "Sedih",
    reply:
      "Perasaan ini boleh ada. Catatan singkat bisa membantumu mengenali pemicunya.",
  },
  {
    score: 3,
    label: "Biasa Aja",
    reply:
      "Hari yang biasa pun tetap berarti. Apa satu hal kecil yang kamu sadari hari ini?",
  },
  {
    score: 4,
    label: "Senang",
    reply:
      "Senang mendengarnya. Tulis apa yang membuatmu merasa lebih ringan agar bisa kamu ulang.",
  },
  {
    score: 5,
    label: "Sangat Senang",
    reply:
      "Hangat sekali. Simpan momen ini sebagai pengingat saat hari terasa berat.",
  },
];

export type MoodTone = "blue" | "sad" | "neutral" | "happy" | "joyful";

export type MoodEntry = {
  score: MoodScore;
  label: string;
  tone: MoodTone;
  note: string;
};

function entry(score: MoodScore, note: string): MoodEntry {
  const tones: Record<MoodScore, MoodTone> = {
    1: "blue",
    2: "sad",
    3: "neutral",
    4: "happy",
    5: "joyful",
  };
  const label = featureMoods.find((mood) => mood.score === score)!.label;
  return { score, label, tone: tones[score], note };
}

export const weeklyMoodHistory: (MoodEntry & { day: string })[] = [
  {
    day: "Senin",
    ...entry(
      2,
      "Hari ini terasa cukup berat, jadi aku memilih berjalan pelan-pelan.",
    ),
  },
  { day: "Selasa", ...entry(3, "Hari ini berjalan seperti biasa.") },
  {
    day: "Rabu",
    ...entry(2, "Aku ingin memberi diriku waktu untuk beristirahat."),
  },
  { day: "Kamis", ...entry(4, "Aku menikmati obrolan ringan bersama teman.") },
  { day: "Jumat", ...entry(3, "Tidak banyak yang berubah hari ini.") },
  {
    day: "Sabtu",
    ...entry(
      5,
      "Hari ini aku punya waktu untuk istirahat dan melakukan hal yang kusukai.",
    ),
  },
  {
    day: "Minggu",
    ...entry(4, "Aku menikmati waktu yang lebih tenang hari ini."),
  },
];

export const monthlyMoodHistory: Record<number, MoodEntry> = {
  2: entry(3, "Hari ini berjalan seperti biasa."),
  4: entry(4, "Aku punya waktu untuk melakukan hal yang kusukai."),
  5: entry(2, "Aku ingin memberi diriku ruang hari ini."),
  8: entry(4, "Ada momen kecil yang menyenangkan hari ini."),
  10: entry(3, "Hari ini terasa biasa saja."),
  11: entry(5, "Aku menikmati waktu bersama orang terdekat."),
  14: entry(2, "Hari ini cukup melelahkan."),
  16: entry(3, "Aku menjalani hari dengan ritmeku sendiri."),
  18: entry(4, "Aku sempat beristirahat dan membaca buku."),
  20: entry(5, "Aku melakukan kegiatan yang sudah lama ingin kucoba."),
  23: entry(4, "Hari ini ada banyak hal kecil yang kusyukuri."),
  25: entry(3, "Hari ini berjalan cukup tenang."),
  27: entry(2, "Aku sedang butuh waktu untuk diriku sendiri."),
  28: entry(4, "Aku menutup hari dengan perasaan yang hangat."),
};

export const weekDayShort = [
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
] as const;

export const chatReplies = [
  {
    short: "Takut lupa materi",
    full: "Aku takut lupa apa yang mau kusampaikan.",
  },
  {
    short: "Khawatir dinilai",
    full: "Aku khawatir dinilai teman-teman.",
  },
] as const;

export const braveChoiceOptions = [
  {
    id: "talk",
    text: "Ajak bicara baik-baik dan jujur.",
    isBrave: true,
    title: "Pilihan Berani!",
    explanation:
      "Kamu menyampaikan kebutuhanmu dengan jelas dan membuka ruang untuk mencari solusi bersama.",
  },
  {
    id: "wait",
    text: "Tunggu dia mengingatnya sendiri.",
    isBrave: false,
    title: "Coba Pikirkan Lagi",
    explanation:
      "Menunggu tanpa bicara membuat kebutuhanmu belum tersampaikan, dan itu bisa menambah rasa kesal.",
  },
] as const;

export const heroInsightBars = [35, 52, 44, 70, 62, 82, 72] as const;
