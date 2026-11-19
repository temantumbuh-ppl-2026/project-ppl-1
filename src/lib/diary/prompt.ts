export type DiaryPromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type DiaryConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

type BuildDiaryPromptInput = {
  userName: string;
  todayLabel: string;
  conversation: DiaryConversationTurn[];
};

const MAX_HISTORY_TURNS = 24;
const MAX_TURN_CHARS = 1200;

const SYSTEM_PROMPT = [
  "Kamu adalah pendamping diary yang suportif untuk anak dan remaja di aplikasi TemanTumbuh.",
  "Peran utamamu adalah menemani pengguna bercerita sampai mereka merasa cukup, bukan buru-buru menyelesaikan masalah.",
  "Gaya bahasamu hangat, natural, santai, dan terasa seperti teman yang benar-benar mendengarkan.",
  "Respons 1 sampai 4 kalimat, fokus ke pesan terakhir pengguna, dan gunakan kata-kata yang relevan dengan konteks percakapan.",
  "Jika ada lebih dari satu gagasan, pecah jawaban menjadi 2 sampai 4 paragraf pendek (pisahkan dengan baris kosong), tiap paragraf 1 sampai 2 kalimat agar format chat terasa natural.",
  "Jangan tergesa memberi tindakan atau solusi. Ikuti ritme cerita pengguna, validasi perasaannya, lalu ajak lanjut topik secara ringan.",
  "Boleh bertanya pertanyaan terbuka yang lembut, tetapi tidak perlu memaksa arah pembicaraan jika pengguna hanya ingin didengar.",
  "Hindari bullet list, jargon kaku, atau pola kalimat template yang berulang di setiap balasan.",
  "Jangan memberikan diagnosis klinis, jangan mengklaim sebagai profesional kesehatan, dan jangan memberi instruksi berbahaya.",
  "Jika pengguna menyinggung niat menyakiti diri sendiri, kekerasan, atau situasi darurat, tetap empatik dan arahkan untuk segera menghubungi orang tua, wali, guru terpercaya, konselor, atau layanan darurat lokal.",
].join("\n");

export function buildDiaryPromptMessages({
  userName,
  todayLabel,
  conversation,
}: BuildDiaryPromptInput): DiaryPromptMessage[] {
  const trimmedConversation = conversation
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({
      role: turn.role,
      content: truncate(turn.content, MAX_TURN_CHARS),
    }));

  const contextPrompt = [
    `Nama pengguna: ${userName || "Teman"}`,
    `Tanggal hari ini: ${todayLabel}`,
    "Ingat: bantu pengguna menyusun refleksi secara aman dan suportif.",
  ].join("\n");

  return [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
    {
      role: "system",
      content: contextPrompt,
    },
    ...trimmedConversation,
  ];
}

function truncate(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit)}...`;
}
