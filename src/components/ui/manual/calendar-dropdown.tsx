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
  ink: "#1B6B6B",
  inkDark: "#0D4646",
  paper: "#FEFCF8",
  white: "#FFFFFF",
  border: "#E2F0F0",
  muted: "#4A7070",
  soft: "#EEF9F8",
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
            boxShadow: "0 2px 8px rgba(13,70,70,0.04)",
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
          boxShadow: "0 16px 40px rgba(13,70,70,0.12)",
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
                "h-7 w-7 bg-white border border-[#E2F0F0] rounded-md hover:bg-[#EEF9F8] text-[#1B6B6B]",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell:
                "text-[#8AADAD] rounded-md w-8 font-semibold text-[10px]",
              row: "flex w-full mt-1",
              cell: "h-8 w-8 text-center text-[11px] p-0 relative [&:has([aria-selected])]:bg-[#E2F5F3] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 p-0 font-medium rounded-md text-[#0D4646] hover:bg-[#EEF9F8]",
              day_selected:
                "bg-[#1A9688] text-white hover:bg-[#1A9688] hover:text-white focus:bg-[#1A9688] focus:text-white",
              day_today: "border border-[#1A9688] text-[#0D4646] bg-[#EEF9F8]",
              day_outside: "text-[#8AADAD] opacity-50",
              day_disabled: "text-[#8AADAD] opacity-40",
              day_hidden: "invisible",
              dropdown:
                "h-8 rounded-md border border-[#E2F0F0] bg-white px-2 text-[11px] font-semibold text-[#0D4646]",
              dropdown_month:
                "h-8 rounded-md border border-[#E2F0F0] bg-white px-2 text-[11px] font-semibold text-[#0D4646]",
              dropdown_year:
                "h-8 rounded-md border border-[#E2F0F0] bg-white px-2 text-[11px] font-semibold text-[#0D4646]",
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
