"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Mail, Twitter, Youtube } from "lucide-react";

import "@/components/landing/home/landing-redesign.css";

const footerLinks = [
  { label: "Tentang TemanTumbuh", href: "/about" },
  { label: "Fitur", href: "/features" },
  { label: "Harga", href: "/pricing" },
  { label: "Cara Kerja", href: "/#how" },
  { label: "Testimoni", href: "/#testi" },
  { label: "Syarat & Ketentuan", href: "/terms" },
  { label: "Kebijakan Privasi", href: "/privacy" },
];

const socialLinks = [
  { label: "Instagram", href: "#", icon: <Instagram size={18} /> },
  { label: "Twitter/X", href: "#", icon: <Twitter size={18} /> },
  { label: "YouTube", href: "#", icon: <Youtube size={18} /> },
];

const copyrightText =
  "TemanTumbuh © 2026. All rights reserved. · Proyek Perangkat Lunak I · Kelompok Cegukan · Universitas Padjadjaran";

// Footer gaya landing page baru; isi (logo, tautan, kontak, sosial) sama dengan footer existing.
function LandingFooter() {
  return (
    <div className="tt-landing">
      <footer>
        <div className="shell footer-grid">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="TemanTumbuh - Beranda">
              <Image
                src="/img/LOGO_TEMANTUMBUH.svg"
                alt=""
                width={34}
                height={34}
              />
              <span>TemanTumbuh</span>
            </Link>
            <p>
              Platform refleksi diri dan kesadaran sosial untuk usia 10-29
              tahun. Tumbuh bersama, lebih aman.
            </p>
            <a href="mailto:temantumbuh.team@gmail.com">
              temantumbuh.team@gmail.com
            </a>
          </div>
          <div>
            <h3>Tautan</h3>
            {footerLinks.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div>
            <h3>Ikuti Kami</h3>
            <div className="socials">
              {socialLinks.map((item) => (
                <a key={item.label} href={item.href} aria-label={item.label}>
                  {item.icon}
                </a>
              ))}
            </div>
            <Link className="footer-button" href="/register">
              Mulai Diary
            </Link>
          </div>
        </div>
        <div className="shell copyright">
          <span>{copyrightText}</span>
        </div>
      </footer>
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();

  if (
    [
      "/",
      "/about",
      "/features",
      "/pricing",
      "/login",
      "/register",
      "/terms",
      "/privacy",
    ].includes(pathname)
  ) {
    return <LandingFooter />;
  }

  return (
    <footer className="relative overflow-hidden bg-white border-t border-brand-border">
      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2.5">
              <Image
                src="/img/LOGO_TEMANTUMBUH.svg"
                alt="TemanTumbuh"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-brand-teal">
                TemanTumbuh
              </span>
            </div>

            <p className="mb-6 max-w-xs text-sm leading-relaxed text-text-brand-secondary">
              Platform refleksi diri dan kesadaran sosial untuk usia 10-29
              tahun. Tumbuh bersama, lebih aman.
            </p>

            <div className="flex flex-col gap-3">
              <a
                href="mailto:temantumbuh.team@gmail.com"
                className="flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-text-brand-secondary transition-colors duration-150 hover:text-brand-teal"
              >
                <Mail size={16} />
                temantumbuh.team@gmail.com
              </a>
            </div>
          </div>

          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-brand-teal">
              Tautan
            </p>
            <ul className="flex flex-col gap-3">
              {footerLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="cursor-pointer text-sm font-medium text-text-brand-secondary transition-colors duration-150 hover:text-brand-teal"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-brand-teal">
              Ikuti Kami
            </p>

            <div className="mb-6 flex gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-page-bg1 text-brand-teal transition-all duration-150 hover:-translate-y-0.5 hover:bg-brand-teal-ghost hover:text-brand-teal-dark"
                >
                  {item.icon}
                </a>
              ))}
            </div>

            <Link
              href="/register"
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-brand-teal px-4 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-brand-teal-mid hover:shadow-lg hover:shadow-brand-teal/20"
            >
              Mulai Diary
            </Link>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-border pt-6 text-center text-xs font-medium text-text-brand-muted">
          {copyrightText}
        </div>
      </div>
    </footer>
  );
}
