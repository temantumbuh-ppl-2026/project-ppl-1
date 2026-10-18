"use client";

import { Check } from "lucide-react";

const DEFAULT_LABELS = ["Akun", "Data Diri", "Laporan"];

interface RegistrationStepperProps {
  /** Index tahap aktif (0-based), sama dengan state `step` di halaman register. */
  current: number;
  labels?: string[];
}

export function RegistrationStepper({
  current,
  labels = DEFAULT_LABELS,
}: RegistrationStepperProps) {
  const total = labels.length;
  const position = current + 1;

  return (
    <>
      <div className="mobile-step-count" aria-hidden="true">
        Langkah {position} dari {total}
      </div>
      <ol
        className="registration-stepper"
        aria-label={`Langkah ${position} dari ${total}: ${labels[current]}`}
      >
        {labels.map((label, index) => {
          const state =
            index < current ? "done" : index === current ? "active" : "pending";

          return (
            <li
              key={label}
              className={state}
              aria-current={index === current ? "step" : undefined}
            >
              <span aria-hidden="true">
                {state === "done" ? <Check strokeWidth={3} /> : index + 1}
              </span>
              <small>
                {label}
                {state === "done" ? (
                  <span className="sr-only"> (selesai)</span>
                ) : null}
              </small>
            </li>
          );
        })}
      </ol>
    </>
  );
}
