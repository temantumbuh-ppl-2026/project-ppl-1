"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mail,
  Sparkles,
  X,
} from "lucide-react";

import { SectionHeader } from "@/components/landing/about/about-primitives";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Button } from "@/components/ui/button";

export function FeaturesDiary() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <div className="w-full">
              <p className="mb-5 text-xs font-extrabold tracking-widest text-brand-teal uppercase">
                01 · TemanCerita
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-text-brand-primary lg:text-4xl">
                Diary yang Benar-Benar Mengerti Perasaan Anda
              </h2>
              <p className="mb-8 text-base leading-relaxed text-text-brand-secondary md:text-lg">
                Tidak seperti diary biasa, TemanCerita menggunakan AI percakapan
                yang mampu memvalidasi, memahami, dan memberikan perspektif baru
                tanpa menghakimi. Setiap entri terenkripsi end-to-end.
              </p>
              <ul className="mb-8 space-y-4 text-sm font-medium text-brand-teal-dark">
                {[
                  "Respons empatik real-time dari Buddy, AI teman curhat Anda",
                  "Mode refleksi terpandu dengan pertanyaan Socratic",
                  "Semua isi diary hanya bisa dibaca Anda sendiri",
                  "Tidak ada data yang dibagikan ke pihak ketiga",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/diary">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_100%)] px-8 font-bold text-white hover:opacity-90"
                >
                  Coba TemanCerita <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08} className="w-full">
            <div className="relative w-full rounded-3xl border border-brand-border bg-page-bg1 p-6 shadow-[0_10px_32px_rgba(26,40,64,0.12)] lg:p-7">
              <div className="ml-auto w-full max-w-[85%] rounded-bl-2xl rounded-t-2xl bg-teal-800 p-4 text-sm font-medium text-white shadow-md">
                Halo, bagaimana harimu dimulai?
              </div>
              <div className="mt-4 w-full max-w-[85%] rounded-br-2xl rounded-t-2xl border border-brand-border bg-white p-4 text-sm text-text-brand-primary shadow-sm">
                Lumayan, tapi agak cemas soal presentasi.
              </div>
              <div className="mt-4 ml-auto w-full max-w-[85%] rounded-bl-2xl rounded-t-2xl bg-teal-800 p-4 text-sm font-medium text-white shadow-md">
                Cemas itu tandanya Anda peduli. Apa yang sudah Anda siapkan?
              </div>
              <div className="mt-4 w-full max-w-[85%] rounded-br-2xl rounded-t-2xl border border-brand-border bg-white p-4 text-sm text-text-brand-primary shadow-sm">
                Slide sudah siap, tapi takut blank di tengah.
              </div>
              <div className="mt-4 ml-auto w-full max-w-[85%] rounded-bl-2xl rounded-t-2xl bg-teal-800 p-4 text-sm font-medium text-white shadow-md">
                Tarik napas. Ingat satu fakta kunci yang paling Anda kuasai.
              </div>

              <div className="mt-6 flex gap-2 border-t border-teal-200/50 pt-4">
                <div className="flex flex-1 items-center rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-teal-dark/50">
                  Ceritakan harimu...
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-white">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function FeaturesBraveChoice() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    if (selectedOption === null) {
      setSelectedOption(index);
    }
  };

  return (
    <section className="border-y border-brand-border/40 bg-[linear-gradient(180deg,var(--color-page-bg1)_0%,var(--color-page-bg0)_100%)] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal className="order-2 w-full lg:order-1" delay={0.08}>
            <div className="w-full overflow-hidden rounded-3xl border border-brand-teal-mid bg-brand-teal-dark p-6 text-white shadow-xl lg:p-7">
              <div className="mb-6 flex items-center gap-3">
                <span className="rounded-md bg-teal-800/80 px-3 py-1 text-xs font-bold">
                  BRAVE CHOICE
                </span>
              </div>
              <h3 className="mb-10 text-xl leading-relaxed font-medium text-teal-50">
                &quot;Teman meminjam uang Anda dan belum mengembalikannya,
                padahal Anda sedang membutuhkannya.&quot;
              </h3>
              <p className="mb-4 text-xs font-bold tracking-widest text-teal-400 uppercase">
                Pilih respons Anda:
              </p>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSelect(0)}
                  disabled={selectedOption !== null}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${
                    selectedOption === null
                      ? "border-transparent bg-white text-text-brand-primary hover:bg-page-bg1"
                      : selectedOption === 0
                        ? "border-brand-teal bg-brand-teal-ghost text-brand-teal-dark shadow-sm"
                        : "border-transparent bg-white text-text-brand-primary opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedOption === 0
                        ? "border-brand-teal bg-brand-teal-light text-white"
                        : "border-teal-200"
                    }`}
                  >
                    {selectedOption === 0 && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                  </div>
                  Ajak dia bicara baik-baik dan jujur.
                </button>

                <button
                  type="button"
                  onClick={() => handleSelect(1)}
                  disabled={selectedOption !== null}
                  className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${
                    selectedOption === null
                      ? "border-transparent bg-white text-text-brand-primary hover:bg-page-bg1"
                      : selectedOption === 1
                        ? "border-red-500 bg-red-50 text-red-900 shadow-sm"
                        : "border-transparent bg-white text-text-brand-primary opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selectedOption === 1
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-brand-border"
                    }`}
                  >
                    {selectedOption === 1 && <X className="h-3 w-3" />}
                  </div>
                  Diam dan tunggu dia yang duluan.
                </button>
              </div>

              {selectedOption !== null && (
                <div
                  className={`mt-5 rounded-xl border p-4 text-sm font-medium ${
                    selectedOption === 0
                      ? "border-brand-teal/30 bg-emerald-900/40 text-brand-teal-ghost"
                      : "border-red-500/30 bg-red-900/40 text-red-100"
                  }`}
                >
                  {selectedOption === 0
                    ? "Benar. Komunikasi asertif dan jujur adalah pilihan yang lebih sehat."
                    : "Kurang tepat. Menunggu tanpa kepastian justru menambah asumsi negatif."}
                </div>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal className="order-1 lg:order-2">
            <div className="w-full">
              <p className="mb-5 text-xs font-extrabold tracking-widest text-brand-teal uppercase">
                02 · Brave Choice
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-text-brand-primary lg:text-4xl">
                Latih Keberanian Anda dalam Situasi Nyata
              </h2>
              <p className="mb-8 text-base leading-relaxed text-text-brand-secondary md:text-lg">
                Brave Choice menyajikan skenario sosial nyata yang dirancang
                bersama psikolog. Anda berlatih membuat keputusan emosional yang
                sehat, berani, dan berempati dalam lingkungan yang aman.
              </p>
              <ul className="mb-8 space-y-4 text-sm font-medium text-brand-teal-dark">
                {[
                  "150+ skenario sosial berbasis riset psikologi remaja",
                  "Feedback instan dengan penjelasan pilihan",
                  "Skor Brave Choice meningkat seiring latihan",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/brave-choice">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_100%)] px-8 font-bold text-white hover:opacity-90"
                >
                  Coba Brave Choice <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

type MoodItem = {
  key: string;
  label: string;
  icon: string;
  color: string;
  softBg: string;
  noteHint: string;
};

export function FeaturesMood() {
  const moodItems: MoodItem[] = [
    {
      key: "very-sad",
      label: "Sangat Sedih",
      icon: "/img/Emojis/FaceVerySad.png",
      color: "#EF4444",
      softBg: "rgba(239,68,68,0.10)",
      noteHint:
        "Hari ini mungkin terasa berat. Tulis hal utama yang paling membebani pikiran Anda.",
    },
    {
      key: "sad",
      label: "Sedih",
      icon: "/img/Emojis/FaceSad.png",
      color: "#F97316",
      softBg: "rgba(249,115,22,0.10)",
      noteHint:
        "Perasaan ini valid. Notes singkat bisa membantu Anda mengenali pemicunya.",
    },
    {
      key: "neutral",
      label: "Biasa Aja",
      icon: "/img/Emojis/FaceNeutral.png",
      color: "#EAB308",
      softBg: "rgba(234,179,8,0.10)",
      noteHint:
        "Mood Anda cukup stabil. Catatan kecil membantu membaca pola harian dengan lebih jelas.",
    },
    {
      key: "happy",
      label: "Senang",
      icon: "/img/Emojis/FaceHappy.png",
      color: "#22C55E",
      softBg: "rgba(34,197,94,0.10)",
      noteHint:
        "Hari yang baik. Tulis apa yang membuat Anda merasa lebih ringan agar bisa diulang.",
    },
    {
      key: "very-happy",
      label: "Sangat Senang",
      icon: "/img/Emojis/FaceVeryHappy.png",
      color: "#10B981",
      softBg: "rgba(16,185,129,0.10)",
      noteHint:
        "Energi Anda sedang tinggi. Simpan momen ini sebagai penguat saat hari terasa berat.",
    },
  ];

  const [selectedMoodIndex, setSelectedMoodIndex] = useState(3);
  const [note, setNote] = useState("");

  const selectedMood = moodItems[selectedMoodIndex];
  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;

  return (
    <section className="border-y border-brand-border/40 bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <div className="w-full">
              <p className="mb-5 text-xs font-extrabold tracking-widest text-brand-teal uppercase">
                03 · Mood Check-In
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-text-brand-primary lg:text-4xl">
                Lacak Emosi Harian Anda Secara Interaktif
              </h2>
              <p className="mb-8 text-base leading-relaxed text-text-brand-secondary md:text-lg">
                Mood Check-In membantu Anda mengenali pola emosi lewat check-in
                sederhana setiap hari. Semakin konsisten, semakin akurat insight
                yang dihasilkan.
              </p>
              <ul className="mb-8 space-y-4 text-sm font-medium text-brand-teal-dark">
                {[
                  "Pilih mood dalam hitungan detik",
                  "Tambahkan notes singkat agar konteks harian Anda terbaca",
                  "Lihat pola emosi mingguan secara visual",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.08} className="w-full">
            <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-[0_10px_32px_rgba(26,40,64,0.12)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-text-brand-primary">
                  Mood Check-In Hari Ini
                </p>
                <p className="text-xs text-text-brand-secondary">
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {moodItems.map((item, index) => {
                  const active = index === selectedMoodIndex;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setSelectedMoodIndex(index)}
                      className="rounded-xl border p-2 transition-all"
                      style={{
                        borderColor: active ? `${item.color}66` : "#D6E2E2",
                        background: active ? item.softBg : "#FFFFFF",
                        boxShadow: active
                          ? `0 8px 18px ${item.color}22`
                          : "none",
                        transform: active ? "translateY(-1px)" : "none",
                      }}
                    >
                      <Image
                        src={item.icon}
                        alt={item.label}
                        width={30}
                        height={30}
                        className="mx-auto h-7 w-7 object-contain"
                      />
                      <p
                        className="mt-1 text-[10px] leading-tight font-semibold"
                        style={{ color: active ? item.color : "#6B7E7E" }}
                      >
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div
                className="mt-5 rounded-2xl border px-4 py-3"
                style={{
                  borderColor: `${selectedMood.color}40`,
                  background: selectedMood.softBg,
                }}
              >
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: selectedMood.color }}
                >
                  Mood Dipilih
                </p>
                <p className="mt-1 text-sm font-semibold text-text-brand-primary">
                  {selectedMood.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-brand-secondary">
                  {selectedMood.noteHint}
                </p>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-text-brand-primary">
                    Notes Singkat (opsional)
                  </p>
                  <p className="text-xs text-text-brand-secondary">
                    {wordCount} kata
                  </p>
                </div>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={4}
                  placeholder="Contoh: Hari ini saya merasa lebih tenang setelah istirahat cukup."
                  className="w-full resize-none rounded-2xl border px-4 py-3 text-sm leading-relaxed text-text-brand-primary outline-none transition-all"
                  style={{
                    background: "#F4FBFA",
                    borderColor: `${selectedMood.color}44`,
                  }}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

type ActionPriority = "High" | "Medium" | "Low";

export function FeaturesInsight() {
  const currentMonth = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  const priorities: {
    priority: ActionPriority;
    title: string;
    desc: string;
  }[] = [
    {
      priority: "High",
      title: "Pertahankan aktivitas pemulih energi",
      desc: "Jadwalkan ulang aktivitas yang terbukti membuat mood Anda membaik.",
    },
    {
      priority: "Medium",
      title: "Catat pola sebelum mood turun",
      desc: "Perhatikan jam tidur, beban tugas, dan interaksi sosial 24 jam terakhir.",
    },
    {
      priority: "Low",
      title: "Lanjutkan refleksi malam",
      desc: "Tulis 2-3 poin singkat setiap malam untuk menjaga konsistensi insight.",
    },
  ];

  const priorityStyles: Record<
    ActionPriority,
    { bg: string; border: string; color: string; label: string }
  > = {
    High: {
      bg: "#FFF7F7",
      border: "#FECACA",
      color: "#DC2626",
      label: "Prioritas tinggi",
    },
    Medium: {
      bg: "#FFFBF1",
      border: "#FDE68A",
      color: "#CA8A04",
      label: "Prioritas sedang",
    },
    Low: {
      bg: "#F7FCFB",
      border: "#A7F3D0",
      color: "#0F766E",
      label: "Prioritas rendah",
    },
  };

  return (
    <section className="bg-[linear-gradient(180deg,var(--color-page-bg1)_0%,var(--color-page-bg0)_100%)] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal className="order-2 w-full lg:order-1" delay={0.08}>
            <div className="rounded-3xl border border-brand-border bg-white p-5 shadow-[0_10px_32px_rgba(26,40,64,0.12)] sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-brand-primary">
                    Insight Dashboard
                  </p>
                  <p className="text-xs text-text-brand-secondary">
                    Ringkasan progres emosional bulanan Anda
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-page-bg1 px-3 py-1 text-xs font-semibold text-brand-teal-dark">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {currentMonth}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-border p-4">
                <p className="text-xs font-bold tracking-wider text-brand-teal uppercase">
                  Ringkasan AI Hari Ini
                </p>
                <p className="mt-2 text-sm leading-relaxed text-text-brand-secondary">
                  Mood Anda cenderung lebih stabil saat jadwal tidur terjaga dan
                  refleksi malam tetap dilakukan. Fokus utama minggu ini adalah
                  menjaga konsistensi rutinitas.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {priorities.map((item) => {
                  const style = priorityStyles[item.priority];
                  return (
                    <div
                      key={item.title}
                      className="rounded-xl border p-3"
                      style={{
                        background: style.bg,
                        borderColor: style.border,
                      }}
                    >
                      <p
                        className="text-[11px] font-bold uppercase"
                        style={{ color: style.color }}
                      >
                        {style.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text-brand-primary">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-text-brand-secondary">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal className="order-1 lg:order-2">
            <div className="w-full">
              <p className="mb-5 text-xs font-extrabold tracking-widest text-brand-teal uppercase">
                04 · Insight Dashboard
              </p>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-text-brand-primary lg:text-4xl">
                Lihat Pola, Bukan Sekadar Angka
              </h2>
              <p className="mb-8 text-base leading-relaxed text-text-brand-secondary md:text-lg">
                Dashboard insight membantu Anda memahami hubungan antara mood,
                catatan harian, dan rutinitas. Visualisasi dibuat sederhana,
                sehingga rekomendasi yang muncul lebih mudah diterapkan.
              </p>
              <ul className="mb-8 space-y-4 text-sm font-medium text-brand-teal-dark">
                {[
                  "Rangkuman bulanan seperti halaman insight utama",
                  "Prioritas tindakan: tinggi, sedang, dan rendah",
                  "Insight AI berbasis pola mood dan notes harian",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 shrink-0 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function FeaturesQuote() {
  return (
    <section className="relative overflow-hidden bg-[#1A2840] px-6 py-24 text-center text-white">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1772724317387-7e763804b637?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')] bg-cover bg-center opacity-20 mix-blend-overlay" />
      <div className="relative z-10 mx-auto max-w-4xl">
        <h2 className="mb-6 text-3xl leading-tight font-bold tracking-tight lg:text-5xl">
          &quot;Bukan tentang sempurna, <br className="hidden lg:block" />
          tapi tentang berani jujur dengan diri Anda sendiri.&quot;
        </h2>
        <p className="text-sm tracking-widest text-teal-200/80">
          - TemanTumbuh
        </p>
      </div>
    </section>
  );
}

export function FeaturesPrivacy() {
  const reportDate = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  );

  return (
    <section className="border-t border-brand-border bg-white px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <ScrollReveal>
          <SectionHeader
            title="Privasi Terjaga, Kepercayaan Terbangun"
            description="Orang tua menerima laporan perkembangan umum setiap minggu, tanpa akses ke isi diary pribadi."
          />
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="mx-auto w-full max-w-4xl rounded-3xl border border-brand-border bg-white p-8 text-left shadow-[0_10px_32px_rgba(26,40,64,0.12)] lg:p-10">
            <div className="flex items-center gap-2 text-brand-teal-dark">
              <Mail className="h-4 w-4" />
              <p className="text-sm font-bold">
                Laporan Mingguan · TemanTumbuh
              </p>
            </div>
            <p className="mt-1 text-xs text-text-brand-secondary">
              {reportDate}
            </p>

            <div className="my-6 h-px w-full bg-brand-border" />

            <div className="space-y-1 text-sm text-text-brand-secondary">
              <p>
                <span className="font-semibold text-text-brand-primary">
                  Dari:
                </span>{" "}
                TemanTumbuh Report System
              </p>
              <p>
                <span className="font-semibold text-text-brand-primary">
                  Untuk:
                </span>{" "}
                Orang Tua/Wali Anda
              </p>
              <p>
                <span className="font-semibold text-text-brand-primary">
                  Subjek:
                </span>{" "}
                Ringkasan Perkembangan Mingguan
              </p>
            </div>

            <h3 className="mt-6 text-xl font-bold text-text-brand-primary">
              Perkembangan Anak Anda Minggu Ini
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-text-brand-secondary">
              Minggu ini anak anda menunjukkan konsistensi yang baik dalam sesi
              refleksi harian. Partisipasi pada latihan keputusan emosional juga
              meningkat dan menunjukkan pola berpikir yang lebih matang.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-text-brand-secondary">
              <span className="font-semibold text-text-brand-primary">
                Catatan Privasi:
              </span>{" "}
              Laporan ini bersifat umum dan tidak memuat isi diary pribadi.
              Detail percakapan serta data sensitif tetap terenkripsi dan hanya
              dapat diakses oleh pengguna terkait.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function FeaturesCTA() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--color-brand-teal-mid)_0%,var(--color-brand-teal)_62%,var(--color-brand-teal-light)_100%)] px-6 py-24 text-white">
      <div className="pointer-events-none absolute -left-24 -top-48 h-136 w-136 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-24 -right-12 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <ScrollReveal>
          <div className="space-y-8">
            <h2 className="text-4xl leading-tight font-bold md:text-5xl">
              Siap Merasakan Semua Fiturnya?
              <br />
              Mulai Perjalanan Anda Sekarang.
            </h2>

            <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/85">
              Bergabunglah secara gratis dan akses TemanCerita, Mood Check-In,
              Brave Choice, serta Insight Dashboard dalam satu platform.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                variant="secondary"
                className="h-14 rounded-2xl bg-white px-10 font-bold text-brand-teal-dark shadow-lg transition-all hover:bg-white/85"
              >
                <Link href="/register">Daftar Gratis Sekarang</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 rounded-2xl border-white/30 bg-transparent px-10 font-bold text-white transition-all hover:bg-white/5 hover:text-white"
              >
                <Link href="/pricing">Lihat Harga</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
