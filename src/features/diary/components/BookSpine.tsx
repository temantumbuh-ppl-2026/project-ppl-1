// ============================================================
//  src/features/diary/components/BookSpine.tsx
//  Dekorasi tulang buku di tengah layout
// ============================================================

import { colors as C } from "../constants/tokens";

export function BookSpine() {
  return (
    <div
      style={{
        width: 20,
        background: `linear-gradient(to right,${C.spine},#C4B49A,${C.spine})`,
        flexShrink: 0,
        position: "relative",
        zIndex: 2,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 3,
            right: 3,
            height: 1,
            background: "rgba(0,0,0,0.10)",
            top: `${20 + i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}
