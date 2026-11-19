"use client";

import { LogOut, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LogoutConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function LogoutConfirmDialog({
  open,
  onConfirm,
  onCancel,
  loading = false,
}: LogoutConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center px-4"
          style={{
            background: "rgba(15,23,30,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-xl"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #f1f5f4" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "rgba(239,68,68,0.08)" }}
                >
                  <LogOut size={15} color="#DC2626" />
                </div>
                <p className="text-[15px] font-bold text-slate-900">
                  Keluar dari akun?
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
              >
                <X size={14} color="#64748b" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-[13px] leading-relaxed text-slate-500">
                Kamu akan keluar dari TemanTumbuh. Yakin ingin melanjutkan?
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-xl text-[13px] font-semibold transition-colors hover:bg-slate-50 disabled:opacity-50"
                style={{ border: "1.5px solid #e2e8f0", color: "#475569" }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: "#DC2626",
                  boxShadow: "0 4px 12px rgba(220,38,38,0.2)",
                }}
              >
                {loading ? "Keluar..." : "Ya, Keluar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
