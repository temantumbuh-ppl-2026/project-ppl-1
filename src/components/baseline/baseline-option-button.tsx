"use client";

import { cn } from "@/lib/utils";

interface BaselineOptionButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function BaselineOptionButton({
  label,
  selected,
  onClick,
  disabled = false,
}: BaselineOptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-24 w-full cursor-pointer items-center justify-center rounded-2xl border-2 px-4 text-center text-lg font-bold transition-all sm:h-28 sm:text-xl",
        selected
          ? "scale-[1.01] border-tt-primary-700 bg-tt-primary-50 text-tt-primary-700 shadow-[0_8px_24px_rgba(13,148,136,0.12)]"
          : "border-tt-gray-200 bg-white text-tt-gray-600 hover:border-tt-primary-300 hover:bg-tt-primary-50/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {label}
    </button>
  );
}
