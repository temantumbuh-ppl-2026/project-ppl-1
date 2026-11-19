"use client";

interface BaselineProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function BaselineProgress({
  currentStep,
  totalSteps,
}: BaselineProgressProps) {
  const percentage = Math.max(
    0,
    Math.min(100, (currentStep / totalSteps) * 100),
  );

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
          Baseline Question
        </span>

        <span className="text-xs font-medium text-slate-400">
          {currentStep}/{totalSteps}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-teal-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
