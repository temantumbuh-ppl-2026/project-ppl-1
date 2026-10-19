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
    expect(content.className).toContain("is-follow-up");
  });

  it("keeps an ordinary AI reply on the normal surface", () => {
    render(
      <ChatBubble
        message={{ role: "ai", text: "Aku mendengarkan.", time: "10.00" }}
      />,
    );
    const bubble = screen.getByText("Aku mendengarkan.");
    expect(bubble.className).toContain("dy-bubble");
    expect(bubble.className).not.toContain("is-follow-up");
  });

  it("does not treat a user's question as an AI follow-up", () => {
    render(
      <ChatBubble
        message={{ role: "user", text: "Boleh cerita?", time: "10.00" }}
      />,
    );
    const bubble = screen.getByText("Boleh cerita?");
    expect(bubble.className).not.toContain("is-follow-up");
    expect(bubble.closest(".dy-msg")?.className).toContain("is-user");
  });

  it("shows the assistant name and timestamp only when requested", () => {
    const { rerender } = render(
      <ChatBubble message={{ role: "ai", text: "Halo.", time: "10.05" }} />,
    );
    expect(screen.getByText("TemanCerita")).toBeTruthy();
    expect(screen.getByText("10.05")).toBeTruthy();

    rerender(
      <ChatBubble
        message={{ role: "ai", text: "Halo.", time: "10.05" }}
        showAiMeta={false}
        showTimestamp={false}
      />,
    );
    expect(screen.queryByText("TemanCerita")).toBeNull();
    expect(screen.queryByText("10.05")).toBeNull();
  });
});
