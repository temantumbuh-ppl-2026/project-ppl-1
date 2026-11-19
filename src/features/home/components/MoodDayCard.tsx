"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MoodFaceIcon,
  getMoodColor,
  getMoodLabel,
} from "@/components/mood/mood-face-icons";
import type { MoodDay } from "../types";

type PopupPosition = {
  top: number;
  left: number;
};

export function MoodDayCard({ d }: { d: MoodDay }) {
  const color = getMoodColor(d.score);
  const hasMood = d.score !== null;
  const note = typeof d.note === "string" ? d.note.trim() : "";
  const hasNote = note.length > 0;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popupPos, setPopupPos] = useState<PopupPosition | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useLayoutEffect(() => {
    function updatePopupPosition() {
      if (!triggerRef.current || !open) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 210;
      const gap = 12;

      let left = rect.left + rect.width / 2;
      const top = rect.top - gap;

      const minX = popupWidth / 2 + 12;
      const maxX = window.innerWidth - popupWidth / 2 - 12;

      if (left < minX) left = minX;
      if (left > maxX) left = maxX;

      setPopupPos({
        top,
        left,
      });
    }

    updatePopupPosition();

    if (open) {
      window.addEventListener("resize", updatePopupPosition);
      window.addEventListener("scroll", updatePopupPosition, true);
    }

    return () => {
      window.removeEventListener("resize", updatePopupPosition);
      window.removeEventListener("scroll", updatePopupPosition, true);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="group relative z-0 h-full overflow-visible"
      style={{ isolation: "isolate" }}
      onPointerEnter={() => {
        if (hasNote) setOpen(true);
      }}
      onPointerLeave={() => setOpen(false)}
    >
      <div
        className="relative z-0 flex h-full min-h-[128px] flex-col items-center rounded-[0.95rem] px-2 py-2.5 text-center transition-all duration-300 ease-out will-change-transform md:min-h-[138px]"
        style={{
          background: d.today
            ? "rgba(214, 161, 27, 0.09)"
            : "var(--tt-dashboard-brand-soft)",
          border: d.today
            ? "1.5px solid var(--tt-dashboard-warning)"
            : "1px solid rgba(26, 150, 136, 0.18)",
        }}
      >
        <p
          className="text-[10px] font-semibold"
          style={{ color: "var(--tt-dashboard-text-2)" }}
        >
          {d.day}
        </p>

        <div className="my-2 flex h-8 items-center justify-center">
          {hasMood ? (
            <div className="relative flex items-center justify-center">
              <button
                ref={triggerRef}
                type="button"
                onClick={() => hasNote && setOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-full outline-none transition-transform duration-200 group-hover:scale-105"
                style={{
                  background: "transparent",
                  boxShadow: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
                aria-label={`Lihat catatan mood ${d.day}`}
              >
                <MoodFaceIcon score={d.score} size={24} />
              </button>
            </div>
          ) : (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-105"
              style={{
                border: "1px dashed #d9e6e4",
                color: "var(--tt-dashboard-text-3)",
                background: "#fff",
              }}
            >
              -
            </div>
          )}
        </div>

        <p
          className="text-[11px] font-semibold"
          style={{ color: "var(--tt-dashboard-text)" }}
        >
          {d.date}
        </p>

        <p
          className="mt-1.5 text-[10px] font-extrabold md:text-sm"
          style={{ color: hasMood ? color : "var(--tt-dashboard-text)" }}
        >
          {hasMood ? `${d.score}/5` : "–"}
        </p>

        <p
          className="mt-1 min-h-[20px] text-[9px] leading-4"
          style={{ color: "var(--tt-dashboard-text-2)" }}
        >
          {getMoodLabel(d.score)}
        </p>

        <div className="mt-auto pt-1.5">
          {d.today ? (
            <div
              className="inline-flex rounded-full px-2 py-0.5 text-[8px] font-bold"
              style={{
                background: "var(--tt-dashboard-warning-soft)",
                color: "var(--tt-dashboard-warning)",
              }}
            >
              Hari ini
            </div>
          ) : (
            <div className="h-[14px]" />
          )}
        </div>
      </div>

      {mounted && hasNote && open && popupPos
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[99999] w-[210px] -translate-x-1/2 -translate-y-full rounded-2xl px-3 py-2.5 text-xs"
              style={{
                top: popupPos.top,
                left: popupPos.left,
                background: "#FFF9EE",
                border: `1.5px solid ${hasMood ? `${color}80` : "#D9E3E2"}`,
                color: "var(--tt-dashboard-text)",
                boxShadow:
                  "0 18px 34px rgba(26,40,64,0.16), 0 6px 14px rgba(26,40,64,0.10)",
              }}
            >
              <div
                className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-[6px] rotate-45"
                style={{
                  background: "#FFF9EE",
                  borderRight: `1.5px solid ${hasMood ? `${color}80` : "#D9E3E2"}`,
                  borderBottom: `1.5px solid ${hasMood ? `${color}80` : "#D9E3E2"}`,
                }}
              />

              <p className="text-[11px] font-bold" style={{ color }}>
                {getMoodLabel(d.score)}
              </p>

              <p className="mt-1 break-words text-[11px] leading-relaxed">
                {note}
              </p>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
