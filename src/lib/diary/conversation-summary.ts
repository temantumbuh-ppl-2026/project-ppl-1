/** Only user-authored excerpts may enter the internal conversation memory. */
export function resolveConversationSummary({
  proposed,
  previous,
  userMessages,
}: {
  proposed: string | null;
  previous: string | null;
  userMessages: string[];
}): string | null {
  if (!proposed) {
    return previous;
  }

  const lines = proposed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0 || lines.length > 3) {
    return previous;
  }

  const sources = userMessages.map(normalize);
  if (
    lines.some(
      (line) =>
        line.length < 12 ||
        !sources.some((source) => source.includes(normalize(line))),
    )
  ) {
    return previous;
  }

  return [...new Set(lines)].join("\n");
}

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("id-ID");
}
