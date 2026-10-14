// ============================================================
// src/app/layout.tsx
// Root layout — global only, tanpa navbar/footer khusus
// ============================================================

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import QueryProvider from "@/components/providers/query-providers";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | TemanTumbuh",
    default: "TemanTumbuh - Tumbuh Bersama, Lebih Aman",
  },
  description:
    "Platform refleksi diri dan kesadaran sosial untuk usia 10–29 tahun.",
  keywords: ["kesehatan mental", "remaja", "refleksi diri", "emosi"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={plusJakartaSans.variable}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          {children}

          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                fontFamily: "var(--tt-font-sans)",
                borderRadius: "var(--tt-radius-md)",
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
