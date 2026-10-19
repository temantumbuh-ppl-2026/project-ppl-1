// ============================================================
//  src/features/diary/components/TypingIndicator.tsx
// ============================================================

import { AiAvatar } from "./AiAvatar";

export function TypingIndicator() {
  return (
    <div className="dy-status" role="status" aria-live="polite">
      <AiAvatar />
      <p>
        <strong>TemanCerita sedang merespons…</strong>
      </p>
      <span className="dy-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}
