export type DiaryConversationStarter = {
  id: string;
  label: string;
  messageText: string;
};

// messageText can be sent unchanged to either existing diary chat endpoint.
export const diaryConversationStarters: readonly DiaryConversationStarter[] = [
  {
    id: "belum-tahu",
    label: "Belum tahu mulai dari mana",
    messageText: "Aku ingin cerita, tapi masih bingung harus mulai dari mana.",
  },
  {
    id: "sekolah",
    label: "Soal sekolah",
    messageText:
      "Ada hal di sekolah yang akhir-akhir ini membuatku kepikiran. Aku ingin cerita pelan-pelan.",
  },
  {
    id: "pertemanan",
    label: "Soal teman",
    messageText:
      "Aku sedang memikirkan hubunganku dengan teman-teman dan ingin membicarakannya.",
  },
  {
    id: "keluarga",
    label: "Soal keluarga",
    messageText: "Ada hal di rumah atau keluargaku yang ingin kuceritakan.",
  },
  {
    id: "hubungan",
    label: "Soal hubungan",
    messageText:
      "Aku ingin cerita tentang hubungan yang sedang membuatku bingung.",
  },
  {
    id: "masa-depan",
    label: "Soal pilihan setelah sekolah",
    messageText:
      "Aku sedang memikirkan pilihan setelah sekolah dan ingin mengurai kebingunganku.",
  },
];
