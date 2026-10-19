// ============================================================
//  src/features/diary/components/ChatBubble.tsx
// ============================================================

import type { ChatMessage } from "../types";
import { AiAvatar } from "./AiAvatar";

type Props = {
  message: ChatMessage;
  showAiMeta?: boolean;
  showTimestamp?: boolean;
};

export function ChatBubble({
  message,
  showAiMeta = true,
  showTimestamp = true,
}: Props) {
  const isAi = message.role === "ai";
  const shouldShowAiMeta = isAi && showAiMeta;
  // TODO BE-04: use explicit follow-up metadata when the message API exposes it.
  const isFollowUp = isAi && message.text.trimEnd().endsWith("?");

  return (
    <div className={`dy-msg ${isAi ? "is-ai" : "is-user"}`}>
      {isAi ? (
        shouldShowAiMeta ? (
          <AiAvatar />
        ) : (
          <span className="dy-avatar-gap" aria-hidden="true" />
        )
      ) : null}

      <div className="dy-msg-col">
        {shouldShowAiMeta ? <p className="dy-msg-name">TemanCerita</p> : null}

        <div className={`dy-bubble ${isFollowUp ? "is-follow-up" : ""}`}>
          {message.text}
        </div>

        {showTimestamp ? <p className="dy-time">{message.time}</p> : null}
      </div>
    </div>
  );
}
