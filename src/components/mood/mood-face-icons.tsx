"use client";

type FaceProps = { active?: boolean; size?: number };

const MOOD_COLORS: Record<
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

export function getMoodLabel(score: number | null): string {
  if (score === null) return "-";
  const labels: Record<number, string> = {
    1: "Sangat Sedih",
    2: "Sedih",
    3: "Biasa Aja",
    4: "Senang",
    5: "Sangat Senang",
  };
  return labels[score] ?? "-";
}

export function MoodFaceIcon({
  score,
  size = 46,
  active = true,
}: {
  score: number | null;
  size?: number;
  active?: boolean;
}) {
  if (!score) return null;
  const c = MOOD_COLORS[score] ?? MOOD_COLORS[3];
  const s = size;
  const cx = s / 2,
    cy = s / 2,
    r = s * 0.46;
  const eyeY = s * 0.42,
    eyeOff = s * 0.145,
    eyeR = s * 0.058;

  const mouths: Record<number, string> = {
    1: `M${s * 0.3} ${s * 0.67} Q${cx} ${s * 0.54} ${s * 0.7} ${s * 0.67}`,
    2: `M${s * 0.32} ${s * 0.65} Q${cx} ${s * 0.56} ${s * 0.68} ${s * 0.65}`,
    3: `M${s * 0.33} ${s * 0.63} L${s * 0.67} ${s * 0.63}`,
    4: `M${s * 0.3} ${s * 0.57} Q${cx} ${s * 0.72} ${s * 0.7} ${s * 0.57}`,
    5: `M${s * 0.28} ${s * 0.55} Q${cx} ${s * 0.76} ${s * 0.72} ${s * 0.55}`,
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={active ? c.bg : "rgba(0,0,0,0.04)"}
        stroke={active ? c.stroke : "#3D5A5A"}
        strokeWidth={s * 0.038}
      />
      <circle
        cx={cx - eyeOff}
        cy={eyeY}
        r={eyeR}
        fill={active ? c.fill : "#3D5A5A"}
      />
      <circle
        cx={cx + eyeOff}
        cy={eyeY}
        r={eyeR}
        fill={active ? c.fill : "#3D5A5A"}
      />
      <path
        d={mouths[score]}
        stroke={active ? c.stroke : "#3D5A5A"}
        strokeWidth={s * 0.05}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function FaceVerySad({ active }: FaceProps) {
  return <MoodFaceIcon score={1} active={active} />;
}
export function FaceSad({ active }: FaceProps) {
  return <MoodFaceIcon score={2} active={active} />;
}
export function FaceNeutral({ active }: FaceProps) {
  return <MoodFaceIcon score={3} active={active} />;
}
export function FaceHappy({ active }: FaceProps) {
  return <MoodFaceIcon score={4} active={active} />;
}
export function FaceVeryHappy({ active }: FaceProps) {
  return <MoodFaceIcon score={5} active={active} />;
}
