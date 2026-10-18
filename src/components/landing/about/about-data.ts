export const aboutImages = {
  hero: "https://images.unsplash.com/photo-1624731556141-847f6d44e0c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwc3R1ZGVudHMlMjBzdXBwb3J0aXZlJTIwZ3JvdXAlMjBzdHVkeSUyMEluZG9uZXNpYXxlbnwxfHx8fDE3NzQ5NTA1MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  youth:
    "https://images.unsplash.com/photo-1747470198294-b906f9d0af48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWVucyUyMHlvdXRoJTIwZW1vdGlvbmFsJTIwd2VsbGJlaW5nJTIwbWVudGFsJTIwaGVhbHRoJTIwc3VwcG9ydHxlbnwxfHx8fDE3NzQ5NTA1Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
} as const;

export type AboutIconName = "compass" | "book" | "shield";

export const aboutPrinciples = [
  { icon: "shield", label: "Privasi terlindungi" },
  { icon: "spark", label: "Teknologi bertanggung jawab" },
  { icon: "people", label: "Berorientasi dampak sosial" },
] as const;

export const missionValues = [
  {
    icon: "compass",
    title: "Mendorong Refleksi Diri",
    text: "Membantu remaja mengenali dan memahami emosinya sendiri melalui Diary, Mood Check-in, dan latihan kecil yang menjaga privasi.",
  },
  {
    icon: "book",
    title: "Edukasi Sosial",
    text: "Menyediakan edukasi interaktif melalui Brave Choice untuk membantu menghadapi berbagai situasi dengan lebih bijak.",
  },
  {
    icon: "shield",
    title: "Jembatan Terpercaya",
    text: "Menjembatani komunikasi antara anak dan orang tua dengan prinsip privasi ketat melalui laporan mingguan yang bersifat umum.",
  },
] as const;

export const sdgIndicators = [
  {
    code: "16.2.1",
    text: "Proporsi anak usia 1–17 tahun yang mengalami hukuman fisik dan/atau agresi psikologis oleh pengasuh dalam satu bulan terakhir.",
  },
  {
    code: "16.2.2",
    text: "Jumlah korban perdagangan manusia per 100.000 penduduk, berdasarkan jenis kelamin, usia, dan bentuk eksploitasi.",
  },
  {
    code: "16.2.3",
    text: "Proporsi perempuan dan laki-laki muda usia 18–29 tahun yang mengalami kekerasan seksual sebelum usia 18 tahun.",
  },
] as const;

export const sdgPillars = [
  {
    title: "Deteksi Dini yang Tetap Menjaga Privasi",
    text: "Sistem membaca sinyal risiko dari jurnal harian tanpa mengekspos isi personal kepada pihak lain.",
  },
  {
    title: "Edukasi Keputusan Aman",
    text: "Skenario interaktif membantu remaja pada tekanan sosial, manipulasi, dan situasi tidak sehat.",
  },
  {
    title: "Dukungan Keluarga yang Seimbang",
    text: "Orang tua menerima ringkasan perkembangan tanpa akses ke isi diary, sehingga kepercayaan remaja tetap terjaga.",
  },
  {
    title: "Perbaikan Berbasis Data",
    text: "Setiap fitur dievaluasi berkala agar dampak perlindungan emosional tetap relevan dan terukur dari waktu ke waktu.",
  },
] as const;

export const teamMembers = [
  {
    name: "Mira Suryani, S.Pd, M.Kom.",
    role: "Dosen Pembimbing",
    subtitle: "Program Studi Informatika · Universitas Padjadjaran",
    imgSrc: "/img/team/mira.png",
    isAdvisor: true,
  },
  {
    name: "Adelia Felisha",
    role: "Project Manager",
    subtitle: "Kelompok Cegukan · Universitas Padjadjaran",
    imgSrc: "/img/team/adelia.png",
    isAdvisor: false,
  },
  {
    name: "Clarisya",
    role: "Frontend Developer",
    subtitle: "Kelompok Cegukan · Universitas Padjadjaran",
    imgSrc: "/img/team/clarisya.png",
    isAdvisor: false,
  },
  {
    name: "Yazid Dahren Fauzan",
    role: "Frontend Developer",
    subtitle: "Kelompok Cegukan · Universitas Padjadjaran",
    imgSrc: "/img/team/yazid.png",
    isAdvisor: false,
  },
  {
    name: "Lukas Austin",
    role: "Backend Developer",
    subtitle: "Kelompok Cegukan · Universitas Padjadjaran",
    imgSrc: "/img/team/lukas.png",
    isAdvisor: false,
  },
  {
    name: "Dzulfadlul",
    role: "Backend Developer",
    subtitle: "Kelompok Cegukan · Universitas Padjadjaran",
    imgSrc: "/img/team/dzul.png",
    isAdvisor: false,
  },
] as const;
