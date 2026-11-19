// ============================================================
//  src/features/diary/components/AiAvatar.tsx
// ============================================================

import { colors as C, fonts } from "../constants/tokens";

export function AiAvatar() {
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "25%",
        background: `linear-gradient(135deg,${C.inkD},${C.inkM})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 900,
          color: C.white,
          fontFamily: fonts.sans,
        }}
      >
        B
      </span>
    </div>
  );
}
