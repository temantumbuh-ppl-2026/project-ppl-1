import { ConversationState, RiskLevel } from "@/app/generated/prisma/client";

export function resolveActionOptions({
  proposed,
  state,
  riskLevel,
  hasSummary,
}: {
  proposed: string[];
  state: ConversationState;
  riskLevel: RiskLevel;
  hasSummary: boolean;
}): string[] {
  if (
    state !== ConversationState.ACTION ||
    riskLevel !== RiskLevel.NONE ||
    !hasSummary
  ) {
    return [];
  }

  const unique = new Map<string, string>();
  for (const option of proposed) {
    const cleaned = option.trim().replace(/\s*\u2014\s*/g, ", ");
    if (cleaned) {
      unique.set(cleaned.toLocaleLowerCase("id-ID"), cleaned);
    }
  }
  const options = [...unique.values()];

  return options.length >= 2 ? options.slice(0, 3) : [];
}

export function parseStoredActionOptions(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.length >= 2 &&
      parsed.length <= 3 &&
      parsed.every((option) => typeof option === "string" && option.length > 0)
      ? parsed
      : [];
  } catch {
    return [];
  }
}
