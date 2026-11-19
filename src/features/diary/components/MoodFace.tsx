// ============================================================
//  src/features/diary/components/MoodFace.tsx
//  SVG emoji mood — tidak ada library yang cocok untuk ini
// ============================================================

import { colors as C } from "../constants/tokens";
import type { MoodScore } from "../types";

const MOOD_CONFIG: Record<
  MoodScore,
  { bg: string; stroke: string; mouth: string }
> = {
  5: { bg: C.okL, stroke: C.ok, mouth: "M5 13.5s2 3 6 3 6-3 6-3" },
  4: {
    bg: "#DCFCE7",
    stroke: "#16A34A",
    mouth: "M6 14s1.5 2.5 5 2.5 5-2.5 5-2.5",
  },
  3: { bg: C.goldS, stroke: C.gold, mouth: "M7.5 15H14.5" },
  2: {
    bg: C.orangeL,
    stroke: C.orange,
    mouth: "M5.5 15.5s1.5-2 5.5-2 5.5 2 5.5 2",
  },
  1: { bg: C.redL, stroke: C.red, mouth: "M5 16s2-3 6-3 6 3 6 3" },
};

type Props = {
  score: MoodScore;
  size?: number;
};

export function MoodFace({ score, size = 32 }: Props) {
  const d = MOOD_CONFIG[score] ?? MOOD_CONFIG[3];
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <circle
        cx={11}
        cy={11}
        r={10}
        fill={d.bg}
        stroke={d.stroke}
        strokeWidth={1.4}
      />
      <circle cx={8} cy={9.5} r={1.2} fill={d.stroke} />
      <circle cx={14} cy={9.5} r={1.2} fill={d.stroke} />
      <path
        d={d.mouth}
        stroke={d.stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
