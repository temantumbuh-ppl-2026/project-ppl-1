// ============================================================
//  src/features/diary/components/AiAvatar.tsx
// ============================================================

import Image from "next/image";

// Avatar TemanCerita memakai logo resmi TemanTumbuh.
export function AiAvatar() {
  return (
    <span className="dy-avatar" aria-hidden="true">
      <Image src="/img/LOGO_TEMANTUMBUH.svg" alt="" width={34} height={34} />
    </span>
  );
}
