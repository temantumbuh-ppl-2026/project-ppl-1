// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ChatBubble } from "@/features/diary/components/ChatBubble";

afterEach(cleanup);

describe("ChatBubble follow-up presentation", () => {
  it("highlights an AI question without rewriting its text", () => {
    const text = "Bagian mana yang ingin kamu ceritakan dulu?  ";
    render(<ChatBubble message={{ role: "ai", text, time: "10.00" }} />);
    const content = screen.getByText(text.trimEnd());
    expect(content.textContent).toBe(text);
    expect(content.parentElement!.style.background).toBe(
      "var(--tt-primary-100)",
    );
    expect(content.parentElement!.style.borderLeftWidth).not.toBe("3px");
  });

  it("keeps an ordinary AI reply on the normal surface", () => {
    render(
      <ChatBubble
        message={{ role: "ai", text: "Aku mendengarkan.", time: "10.00" }}
      />,
    );
    const bubble = screen.getByText("Aku mendengarkan.").parentElement!;
    expect(bubble.style.background).toBe("var(--tt-surface)");
    expect(bubble.style.borderLeftWidth).not.toBe("3px");
  });

  it("does not treat a user's question as an AI follow-up", () => {
    render(
      <ChatBubble
        message={{ role: "user", text: "Boleh cerita?", time: "10.00" }}
      />,
    );
    const bubble = screen.getByText("Boleh cerita?").parentElement!;
    expect(bubble.style.background).not.toBe("var(--tt-primary-100)");
    expect(bubble.style.borderLeftWidth).not.toBe("3px");
  });
});
