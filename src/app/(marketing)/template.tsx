"use client";

import { motion, useReducedMotion } from "framer-motion";

// Template dirender ulang di setiap perpindahan halaman, sehingga konten baru
// muncul dengan fade-in halus sementara Navbar dan Footer tetap di tempatnya.
export default function MarketingTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
