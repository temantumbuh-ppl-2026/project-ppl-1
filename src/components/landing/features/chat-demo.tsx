"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { chatReplies } from "./features-data";

// Contoh lokal: pilihan balasan hanya mengubah tampilan, tidak mengirim apa pun.
export function ChatDemo() {
  const [reply, setReply] = useState<string | null>(null);

  return (
    <div className="chat-demo product-demo">
      <div className="demo-topline">
        <div>
          <span className="online-dot" /> TemanCerita
        </div>
        <span className="demo-label">Contoh tampilan</span>
      </div>
      <div className="chat-thread" aria-live="polite">
        <div className="chat-bubble chat-buddy">
          Hai, bagaimana harimu?<small>10.02</small>
        </div>
        <div className="chat-bubble chat-user">
          Hari ini aku merasa cemas sebelum presentasi.<small>10.03</small>
        </div>
        <div className="chat-bubble chat-buddy">
          Bagian mana dari presentasinya yang paling membuatmu khawatir?
          <small>10.03</small>
        </div>
        {reply && (
          <div className="chat-bubble chat-user">
            {reply}
            <small>10.04</small>
          </div>
        )}
      </div>
      <div className="reply-options">
        <span>Pilih contoh balasan:</span>
        {chatReplies.map((option) => (
          <button
            aria-pressed={reply === option.full}
            className={reply === option.full ? "active" : ""}
            key={option.short}
            onClick={() => setReply(option.full)}
            type="button"
          >
            {option.short}
          </button>
        ))}
      </div>
      <div className="chat-input" aria-hidden="true">
        Ceritakan harimu...{" "}
        <span>
          <ArrowRight size={16} />
        </span>
      </div>
    </div>
  );
}
