"use client";

import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/** Batas awal pemilih tanggal, sama dengan rentang tahun datepicker existing. */
export const MOOD_HISTORY_MIN_DATE = new Date(2020, 0, 1);

// Minggu riwayat mood dimulai hari Minggu, sehingga kalender mengikuti urutan yang sama.
const CALENDAR_LABELS = {
  labelMonthDropdown: () => "Pilih bulan",
  labelYearDropdown: () => "Pilih tahun",
  labelPrevious: () => "Bulan sebelumnya",
  labelNext: () => "Bulan berikutnya",
  labelDayButton: (
    date: Date,
    modifiers: { today?: boolean; selected?: boolean; disabled?: boolean },
  ) =>
    [
      modifiers.today ? "Hari ini" : null,
      format(date, "cccc, d MMMM yyyy", { locale: localeId }),
      modifiers.selected ? "dipilih" : null,
      modifiers.disabled ? "tidak tersedia" : null,
    ]
      .filter(Boolean)
      .join(", "),
};

type Props = {
  selectedDate?: Date;
  today: Date;
  onDateChange: (date: Date) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  disablePrev?: boolean;
  disableNext?: boolean;
  isCurrentWeek: boolean;
};

export function WeekFilterBar({
  selectedDate,
  today,
  onDateChange,
  onPrev,
  onNext,
  onToday,
  disablePrev,
  disableNext,
  isCurrentWeek,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [visibleMonth, setVisibleMonth] = React.useState<Date>(
    selectedDate ?? today,
  );

  React.useEffect(() => {
    if (selectedDate) setVisibleMonth(selectedDate);
  }, [selectedDate]);

  const monthLabel = React.useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(selectedDate ?? today),
    [selectedDate, today],
  );

  return (
    <div className="week-controls">
      <div className="week-nav">
        <button
          type="button"
          className="week-nav-button"
          onClick={onPrev}
          disabled={disablePrev}
          aria-label="Minggu sebelumnya"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="week-picker-trigger"
              aria-label={`Pilih tanggal riwayat mood, saat ini ${monthLabel}`}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span>{monthLabel}</span>
            </button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={8}
            collisionPadding={12}
            className="z-[9999] w-auto rounded-2xl border p-3 shadow-xl"
            style={{
              background: "#FEFCF8",
              borderColor: "var(--tt-dashboard-card-border)",
            }}
          >
            <Calendar
              mode="single"
              locale={localeId}
              weekStartsOn={0}
              labels={CALENDAR_LABELS}
              selected={selectedDate}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              onSelect={(date) => {
                if (!date) return;
                onDateChange(date);
                setOpen(false);
              }}
              captionLayout="dropdown"
              startMonth={MOOD_HISTORY_MIN_DATE}
              endMonth={today}
              disabled={[{ before: MOOD_HISTORY_MIN_DATE }, { after: today }]}
              autoFocus
              className="mx-auto rounded-md"
            />
          </PopoverContent>
        </Popover>

        <button
          type="button"
          className="week-nav-button"
          onClick={onNext}
          disabled={disableNext}
          aria-label="Minggu berikutnya"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      {!isCurrentWeek ? (
        <button type="button" className="week-today-button" onClick={onToday}>
          Kembali ke hari ini
        </button>
      ) : null}
    </div>
  );
}
