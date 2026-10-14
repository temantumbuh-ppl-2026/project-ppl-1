// Shared clay-to-teal mood palette for UI and report presentation.
export const MOOD_COLORS: Record<
  number,
  { bg: string; stroke: string; fill: string }
> = {
  1: { bg: "rgba(138,74,31,0.10)", stroke: "#8A4A1F", fill: "#8A4A1F" },
  2: { bg: "rgba(122,82,0,0.10)", stroke: "#7A5200", fill: "#7A5200" },
  3: { bg: "rgba(61,90,90,0.10)", stroke: "#3D5A5A", fill: "#3D5A5A" },
  4: { bg: "rgba(42,122,116,0.10)", stroke: "#2A7A74", fill: "#2A7A74" },
  5: { bg: "rgba(26,92,54,0.10)", stroke: "#1A5C36", fill: "#1A5C36" },
};

export function getMoodColor(score: number | null): string {
  if (score === null) return "#3D5A5A";
  return MOOD_COLORS[score]?.stroke ?? "#3D5A5A";
}
