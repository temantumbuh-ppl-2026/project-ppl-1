import { ConversationState, RiskLevel } from "@/app/generated/prisma/client";
import type { DiaryStructuredOutput } from "@/lib/diary/structured-output";

const DIRECT_TASK_REQUEST =
  /(?:\b(?:tolong|bisa(?:kah)?|mohon|coba|bantu(?:in)?|bagaimana|gimana|please|can you|could you)\b.{0,30}|^\s*)(?:buat(?:kan)?|bikin(?:kan)?|tulis(?:kan)?|kerjakan|selesaikan|menyelesaikan|debug|perbaiki|hitung(?:kan)?|jawab(?:kan)?|ajari|jelaskan|write|build|solve|fix|generate|implement)\b.{0,65}\b(?:kode|code|coding|program|skrip|script|fungsi|function|algoritma|website|aplikasi|app|pr|soal|tugas|homework|essay|esai|makalah|presentasi)\b/i;
const TASK_ANSWER =
  /```|\b(?:function|const|let|import|export)\s+\w+|<\/?(?:html|script|body)>/i;

export function applyDiaryResponseGuardrails(
  output: DiaryStructuredOutput,
  userMessage: string,
): DiaryStructuredOutput {
  const reply = withoutEmDash(output.reply);
  const taskRequest = DIRECT_TASK_REQUEST.test(userMessage);
  const taskAnswer = TASK_ANSWER.test(reply);

  if (
    output.safety.riskLevel === RiskLevel.NONE &&
    (taskRequest || taskAnswer)
  ) {
    return {
      ...output,
      reply:
        "Aku bisa nemenin kamu cerita soal hal itu. Bagian mana yang paling bikin kamu kepikiran?",
      conversationState: ConversationState.EXPLORATION,
      conversationSummary: null,
      proactiveSuggestion: null,
      actionOptions: [],
    };
  }

  return {
    ...output,
    reply,
    proactiveSuggestion: output.proactiveSuggestion
      ? withoutEmDash(output.proactiveSuggestion)
      : null,
    actionOptions: output.actionOptions.map(withoutEmDash),
  };
}

function withoutEmDash(value: string): string {
  return value.replace(/\s*\u2014\s*/g, ", ");
}
