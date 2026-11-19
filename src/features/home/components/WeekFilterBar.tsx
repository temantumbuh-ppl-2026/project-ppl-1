"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Props = {
  selectedDate?: Date;
  onDateChange: (date: Date | undefined) => void;
  onPrev: () => void;
  onNext: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
};

export function WeekFilterBar({
  selectedDate,
  onDateChange,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(
    selectedDate ?? new Date(),
  );

  React.useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [selectedDate]);

  // Short label (e.g. "Apr 2026") for narrow screens, full label for wider
  const shortLabel = React.useMemo(() => {
    const base = selectedDate ?? new Date();
    return new Intl.DateTimeFormat("id-ID", {
      month: "short",
      year: "numeric",
    }).format(base);
  }, [selectedDate]);

  const fullLabel = React.useMemo(() => {
    const base = selectedDate ?? new Date();
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(base);
  }, [selectedDate]);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={onPrev}
        disabled={disablePrev}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          background: "var(--tt-dashboard-chip-bg)",
          color: "var(--tt-dashboard-text)",
        }}
      >
        <ChevronLeft size={13} />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-bold transition hover:opacity-80 sm:gap-1.5 sm:px-3 sm:text-[12px]"
            style={{
              background: "var(--tt-dashboard-chip-bg)",
              color: "var(--tt-dashboard-text)",
            }}
          >
            <CalendarDays size={12} className="shrink-0" />
            {/* Short label on mobile, full label on sm+ */}
            <span className="whitespace-nowrap sm:hidden">{shortLabel}</span>
            <span className="hidden whitespace-nowrap sm:inline">
              {fullLabel}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={8}
          className="z-[9999] w-[280px] rounded-2xl border p-3 shadow-xl"
          style={{
            background: "#FEFCF8",
            borderColor: "var(--tt-dashboard-card-border)",
          }}
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(date) => {
              onDateChange(date);
              if (date) setOpen(false);
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2035}
            initialFocus
            className="mx-auto rounded-md"
          />
        </PopoverContent>
      </Popover>

      <button
        onClick={onNext}
        disabled={disableNext}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
        style={{
          background: "var(--tt-dashboard-chip-bg)",
          color: "var(--tt-dashboard-text)",
        }}
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}
