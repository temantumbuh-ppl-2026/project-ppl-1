// src/app/(auth)/layout.tsx

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Jika user sudah login, langsung redirect ke halaman yang sesuai.
  // Ini mencegah flash Navbar+Footer kosong saat proses redirect.
  if (session?.user?.id) {
    // User authenticated tapi perlu complete profile → render tanpa Navbar/Footer
    return (
      <div
        className="tt-auth-page min-h-screen flex flex-col"
        style={{ fontFamily: "var(--tt-font-sans)" }}
      >
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div
      className="tt-auth-page min-h-screen flex flex-col"
      style={{ fontFamily: "var(--tt-font-sans)" }}
    >
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
