"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const brand = {
  ink: "var(--tt-primary-700)",
  inkDark: "var(--tt-primary-900)",
  paper: "var(--tt-gray-50)",
  white: "var(--tt-surface)",
  border: "var(--tt-gray-100)",
  muted: "var(--tt-gray-600)",
  soft: "var(--tt-primary-50)",
};

type Props = {
  date?: Date;
  monthLabel?: string;
  onChange: (date: Date | undefined) => void;
};

export function CalendarDropdown({ date, monthLabel, onChange }: Props) {
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(
    date ?? new Date(),
  );

  React.useEffect(() => {
    if (date) {
      setVisibleMonth(date);
    }
  }, [date]);

  const triggerLabel = React.useMemo(() => {
    if (date) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    }

    return monthLabel || "Pilih tanggal";
  }, [date, monthLabel]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-expanded={open}
          aria-label="Pilih tanggal diary"
          style={{
            width: "100%",
            minHeight: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 10,
            border: `1px solid ${brand.border}`,
            background: brand.white,
            color: brand.inkDark,
            cursor: "pointer",
            fontFamily:
              "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            boxShadow:
              "0 2px 8px color-mix(in srgb, var(--tt-primary-900) 4%, transparent)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <CalendarDays size={14} color={brand.ink} />
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {triggerLabel}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="z-[9999] p-0"
        style={{
          width: 280,
          borderRadius: 16,
          border: `1px solid ${brand.border}`,
          background: brand.paper,
          overflow: "hidden",
          boxShadow:
            "0 16px 40px color-mix(in srgb, var(--tt-primary-900) 12%, transparent)",
          zIndex: 9999,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            padding: 10,
            fontFamily:
              "var(--font-plus-jakarta), 'Plus Jakarta Sans', sans-serif",
            background: brand.paper,
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            month={visibleMonth}
            onMonthChange={setVisibleMonth}
            onSelect={(d) => {
              onChange(d);
              if (d) {
                setVisibleMonth(d);
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            fromYear={2000}
            toYear={2035}
            initialFocus
            className="rounded-md"
            classNames={{
              months: "flex flex-col",
              month: "space-y-3",
              caption: "flex justify-center pt-1 relative items-center gap-2",
              caption_label: "hidden",
              nav: "flex items-center gap-1",
              nav_button:
                "h-7 w-7 bg-white border border-tt-gray-100 rounded-md hover:bg-tt-primary-50 text-tt-primary-700",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-tt-gray-400 rounded-md w-8 font-semibold text-[12px]",
              row: "flex w-full mt-1",
              cell: "h-8 w-8 text-center text-[12px] p-0 relative [&:has([aria-selected])]:bg-tt-primary-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 p-0 font-medium rounded-md text-tt-primary-900 hover:bg-tt-primary-50",
              day_selected:
                "bg-tt-button-primary text-white hover:bg-tt-button-primary hover:text-white focus:bg-tt-button-primary focus:text-white",
              day_today:
                "border border-tt-primary-500 text-tt-primary-900 bg-tt-primary-50",
              day_outside: "text-tt-gray-400 opacity-50",
              day_disabled: "text-tt-gray-400 opacity-40",
              day_hidden: "invisible",
              dropdown:
                "h-8 rounded-md border border-tt-gray-100 bg-white px-2 text-[12px] font-semibold text-tt-primary-900",
              dropdown_month:
                "h-8 rounded-md border border-tt-gray-100 bg-white px-2 text-[12px] font-semibold text-tt-primary-900",
              dropdown_year:
                "h-8 rounded-md border border-tt-gray-100 bg-white px-2 text-[12px] font-semibold text-tt-primary-900",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
