import {
  ConversationState,
  RiskLevel,
  SafetyCategory,
} from "@/app/generated/prisma/client";
import type { DiaryStructuredOutput } from "@/lib/diary/structured-output";

// Operational product criteria, not a clinical score or a medical diagnosis.
export const DIARY_SAFETY_PROMPT = [
  "Klasifikasikan keselamatan dari pesan terbaru dan konteks pengguna, bukan dari satu kata, angka mood, topik, atau conversation state saja.",
  "NONE: cerita sehari-hari, sedih, marah, lelah, atau senang tanpa indikasi ancaman keselamatan. Contoh: 'Aku sedih karena nilai ujianku turun' tetap NONE jika tidak ada sinyal risiko lain.",
  "ATTENTION: ada sinyal mengkhawatirkan tetapi urgensi atau keselamatan saat ini belum jelas, misalnya merasa sangat putus asa, keinginan pasif untuk menghilang, atau pengalaman ancaman yang waktunya belum jelas. Tanggapi secara suportif dan tanyakan satu hal tentang keselamatan saat ini; jangan menganggapnya aman tanpa klarifikasi.",
  "HIGH: ada niat saat ini untuk menyakiti diri atau orang lain, rencana atau tindakan yang sedang berlangsung, atau ancaman fisik, kekerasan, dan eksploitasi yang membuat pengguna atau orang lain tidak aman sekarang. Contoh: 'Aku ingin menyakiti diriku sekarang' atau 'Orang yang mengancamku ada di sini dan aku tidak aman' memerlukan HIGH. Jangan menunggu rincian cara atau metode untuk mengutamakan keselamatan.",
  "Bedakan pengalaman yang sudah berlalu, penyangkalan, kutipan, cerita fiksi, dan pertanyaan umum dari ancaman yang masih aktif. Jangan menaikkan risiko hanya karena sebuah istilah muncul. Jika keselamatan sekarang belum jelas setelah ada sinyal nyata, gunakan ATTENTION dan periksa kondisi pengguna. Ancaman aktif terhadap orang lain yang diceritakan pengguna juga perlu diperhatikan.",
  "Kategori menunjukkan jenis sinyal, bukan diagnosis: SELF_HARM untuk risiko terhadap diri; HARM_TO_OTHERS untuk ancaman terhadap orang lain; DOMESTIC_VIOLENCE untuk kekerasan di rumah; BULLYING_THREAT untuk perundungan yang mengancam keselamatan; GROOMING_EXPLOITATION untuk grooming atau eksploitasi; VIOLENCE_ABUSE untuk kekerasan lain; SEVERE_DISTRESS untuk distress berat; OTHER jika kategori khusus belum cocok.",
  "NONE wajib flag=false, category=null, summary=null. ATTENTION dan HIGH wajib flag=true dengan category valid dan summary singkat yang menjelaskan alasan urgensinya. Summary tidak memuat nama, kontak, alamat, kutipan pesan, diagnosis, atau rincian metode berbahaya. Jangan mengarang alasan yang tidak disampaikan pengguna.",
  "Saat ATTENTION, cek apakah pengguna aman dan sarankan orang dewasa tepercaya yang aman bila relevan. Saat HIGH, prioritaskan bantuan langsung: pendamping tepercaya yang aman, layanan darurat setempat atau IGD terdekat jika bahaya segera. Jangan menyuruh pengguna menghadapi pelaku, merampas benda, atau melakukan hal yang menambah bahaya. Jangan mengarahkan otomatis ke orang tua jika keluarga menjadi sumber ancaman.",
  "Pada ATTENTION dan HIGH isi actionOptions [] dan proactiveSuggestion null. Arahan keselamatan boleh diberikan tanpa menunggu pengguna meminta solusi. Jangan memberi diagnosis, menghakimi, menyalahkan, mengklaim sebagai tenaga profesional, menjanjikan kerahasiaan mutlak, atau menjelaskan cara menyakiti diri/orang lain. Jangan mengarang nomor bantuan atau mengklaim admin sudah dihubungi.",
].join("\n");

const UNSAFE_RESPONSE_PATTERNS = [
  /\b(?:kamu|anda|dirimu)\s+(?:(?:pasti|jelas|memang)\s+)?(?:(?:mengidap|menderita|mengalami|punya|memiliki)\s+)(?:depresi(?:\s+klinis)?|bipolar|skizofrenia|ptsd|ocd|adhd|gangguan\s+(?:mental|jiwa|kepribadian|kecemasan))\b/i,
  /\b(?:kamu|anda)\s+(?:pasti|jelas)\s+(?:depresi|bipolar|skizofrenia)\b/i,
  /\b(?:kamu|anda)\s+(?:(?:memang|cuma|hanya)\s+)?(?:lebay|bodoh|lemah|tidak\s+berguna)\b|\bini\s+(?:semua\s+)?salahmu\b/i,
  /\b(?:aku|saya)\s+(?:adalah|sebagai)\s+(?:dokter|psikolog|psikiater|terapis)\b/i,
  /\b(?:sebaiknya|lebih baik|silakan)\s+(?:kamu\s+)?(?:bunuh diri|menyakiti diri|melukai diri|menyakiti orang lain)\b/i,
  /\b(?:coba|cobalah|gunakan|siapkan)\b[^.!?\n]{0,60}\b(?:untuk|agar|supaya)\s+(?:bunuh diri|menyakiti diri|melukai diri|menyakiti orang lain)\b/i,
  /\b(?:aku|saya)\s+(?:sudah|telah)\s+(?:menghubungi|memberi tahu|melaporkan ke)\s+(?:admin|orang tua|polisi)\b/i,
];

function highRiskReply(category: SafetyCategory | null): string {
  if (category === SafetyCategory.HARM_TO_OTHERS) {
    return "Aku mendengarkan, dan yang paling penting sekarang adalah menjaga kamu dan orang lain tetap aman. Jika memungkinkan tanpa menambah bahaya, beri jarak dari orang yang ingin kamu sakiti dan minta orang dewasa yang kamu percaya untuk mendampingi.\n\nJika ada bahaya langsung atau seseorang terluka, minta bantuan layanan darurat setempat atau IGD terdekat sekarang. Ada orang yang aman untuk kamu hubungi saat ini?";
  }

  if (category === SafetyCategory.SELF_HARM) {
    return "Aku mendengarkan, dan aku ingin membantu kamu tetap aman sekarang. Jika memungkinkan tanpa membahayakan dirimu, menjauhlah dari hal yang bisa melukaimu dan hubungi orang dewasa yang kamu percaya untuk menemani, supaya kamu tidak menghadapi ini sendirian.\n\nJika kamu sudah terluka atau merasa bisa menyakiti diri sekarang, minta bantuan layanan darurat setempat atau IGD terdekat segera. Ada orang yang aman untuk kamu hubungi sekarang?";
  }

  return "Aku mendengarkan, dan keselamatanmu perlu didahulukan sekarang. Jika memungkinkan tanpa menambah bahaya, pindahlah ke tempat yang lebih aman dan hubungi orang dewasa yang kamu percaya, seperti guru, konselor, atau kerabat yang aman untuk mendampingi.\n\nJika ancaman sedang berlangsung atau ada yang terluka, minta bantuan layanan darurat setempat atau IGD terdekat segera. Siapa yang aman untuk kamu hubungi sekarang?";
}

/** Constrains output after the one model generation, before persistence or SSE. */
export function applyDiarySafetyPolicy(
  output: DiaryStructuredOutput,
): DiaryStructuredOutput {
  const hasRisk = output.safety.riskLevel !== RiskLevel.NONE;
  const violatesBoundary = [
    output.reply,
    ...output.actionOptions,
    output.proactiveSuggestion ?? "",
  ].some((text) =>
    UNSAFE_RESPONSE_PATTERNS.some((pattern) => pattern.test(text)),
  );

  if (output.safety.riskLevel === RiskLevel.HIGH) {
    return {
      ...output,
      reply: highRiskReply(output.safety.category),
      proactiveSuggestion: null,
      actionOptions: [],
    };
  }

  if (violatesBoundary) {
    return {
      ...output,
      reply: hasRisk
        ? "Aku mendengarkan, dan aku ingin memastikan kamu aman. Kamu bisa menghubungi orang dewasa yang kamu percaya dan aman untuk diajak bicara. Sekarang kamu merasa aman di tempatmu?"
        : "Aku ingin menanggapi ceritamu dengan hati-hati. Kita bisa membahas apa yang kamu rasakan tanpa memberi label atau menyalahkanmu. Apa yang paling kamu butuhkan sekarang?",
      conversationState:
        output.conversationState === ConversationState.ACTION
          ? ConversationState.REFLECTION
          : output.conversationState,
      proactiveSuggestion: null,
      actionOptions: [],
    };
  }

  return hasRisk
    ? { ...output, proactiveSuggestion: null, actionOptions: [] }
    : output;
}
