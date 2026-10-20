import {
  ConversationState,
  DiaryTopic,
  RiskLevel,
} from "@/app/generated/prisma/client";

type ResolveConversationStateInput = {
  previous: ConversationState;
  proposed: ConversationState;
  previousTopics: DiaryTopic[];
  nextTopics: DiaryTopic[];
  userMessage: string;
  hasSummary: boolean;
  riskLevel: RiskLevel;
  isMoodGreeting?: boolean;
};

const ACTION_REQUEST =
  /(?:mau|ingin|butuh|boleh|bagaimana|gimana|apa|bantu|cari|coba).{0,50}(?:saran|solusi|langkah|pilihan|jalan keluar|lakukan)/i;
const ACTION_REFUSAL =
  /(?:tidak|nggak|gak|enggak|belum|jangan)\s+(?:mau|ingin|butuh|perlu|siap)?\s*(?:saran|solusi|langkah|pilihan|bahas)/i;
const LISTENING_ONLY = /(?:cuma|hanya)\s+(?:ingin|mau|butuh)\s+didengar/i;
const SUMMARY_REQUEST = /(?:rangkum|ringkas|simpulkan|kesimpulan)/i;
const CLOSING_REQUEST =
  /(?:cukup (?:dulu|sampai sini)|selesai (?:dulu|cerita)|sudah dulu|udahan|mau berhenti|ingin berhenti|sampai (?:sini|nanti))/i;

/** Keep model-proposed stages within the user's observable conversation flow. */
export function resolveConversationState({
  previous,
  proposed,
  previousTopics,
  nextTopics,
  userMessage,
  hasSummary,
  riskLevel,
  isMoodGreeting = false,
}: ResolveConversationStateInput): ConversationState {
  if (isMoodGreeting) {
    return ConversationState.EXPLORATION;
  }

  const wantsToClose = CLOSING_REQUEST.test(userMessage);
  if (wantsToClose && proposed === ConversationState.CLOSING) {
    return ConversationState.CLOSING;
  }

  const changedTopic =
    previousTopics.length > 0 &&
    nextTopics.length > 0 &&
    !nextTopics.some((topic) => previousTopics.includes(topic)) &&
    !nextTopics.includes(DiaryTopic.LAINNYA);

  if (previous === ConversationState.CLOSING || changedTopic) {
    return ConversationState.EXPLORATION;
  }

  if (proposed === ConversationState.ACTION) {
    const wantsAction =
      (previous === ConversationState.ACTION ||
        ACTION_REQUEST.test(userMessage)) &&
      !ACTION_REFUSAL.test(userMessage) &&
      !LISTENING_ONLY.test(userMessage);

    if (
      hasSummary &&
      wantsAction &&
      riskLevel !== RiskLevel.HIGH &&
      (previous === ConversationState.CLARIFICATION ||
        previous === ConversationState.REFLECTION ||
        previous === ConversationState.ACTION)
    ) {
      return ConversationState.ACTION;
    }

    return previous === ConversationState.ACTION
      ? ConversationState.REFLECTION
      : previous;
  }

  if (proposed === ConversationState.REFLECTION) {
    if (
      hasSummary &&
      (previous !== ConversationState.EXPLORATION ||
        SUMMARY_REQUEST.test(userMessage))
    ) {
      return ConversationState.REFLECTION;
    }

    return ConversationState.CLARIFICATION;
  }

  if (proposed === ConversationState.CLOSING) {
    return previous;
  }

  return proposed;
}
