// Shared mood palette for UI and report presentation.
// Cool-to-warm ramp, no red: blue (feeling blue) -> violet -> teal -> green -> amber (sunshine).
// Strokes keep at least 4.5:1 contrast on white so they stay readable as text.
export const MOOD_COLORS: Record<
  number,
  { bg: string; stroke: string; fill: string }
> = {
  1: { bg: "rgba(43,108,176,0.12)", stroke: "#2B6CB0", fill: "#2B6CB0" },
  2: { bg: "rgba(124,92,191,0.12)", stroke: "#7C5CBF", fill: "#7C5CBF" },
  3: { bg: "rgba(42,122,116,0.12)", stroke: "#2A7A74", fill: "#2A7A74" },
  4: { bg: "rgba(59,131,24,0.12)", stroke: "#3B8318", fill: "#3B8318" },
  5: { bg: "rgba(168,101,0,0.12)", stroke: "#A86500", fill: "#A86500" },
};

export function getMoodColor(score: number | null): string {
  if (score === null) return "#3D5A5A";
  return MOOD_COLORS[score]?.stroke ?? "#3D5A5A";
}
