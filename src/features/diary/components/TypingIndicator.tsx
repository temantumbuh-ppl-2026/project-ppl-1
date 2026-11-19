// ============================================================
//  src/features/diary/components/TypingIndicator.tsx
// ============================================================

import { colors as C } from "../constants/tokens";
import { AiAvatar } from "./AiAvatar";

export function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
      <AiAvatar />
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 14,
          borderBottomLeftRadius: 4,
          background: C.white,
          border: `1px solid ${C.bdL}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.ink,
                opacity: 0.4,
                animation: `ttBounce 1s ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
