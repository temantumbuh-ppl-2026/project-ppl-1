# TemanTumbuh LLM & AI Chatbot Audit

Reviewed repository areas: `src/lib/diary`, `src/app/api/diary`, `src/features/diary`, `src/lib/insight`, `src/app/api/insight`, `src/features/insight`, `src/lib/mood`, `src/features/home`, `src/lib/baseline`, `src/lib/diary/brave-choice-service.ts`, Prisma schema/models, AI-related tests under `tests/api` and `tests/lib`, `package.json`, and relevant docs.

## 1. Executive Summary

- TemanTumbuh has two implemented OpenAI-compatible LLM features: TemanCerita diary chatbot and premium daily insight generation.
- The chatbot uses a clear supportive system prompt, bounded recent chat history, OpenAI SDK calls against a configurable LiteLLM/Koboi base URL, encrypted chat persistence, and streaming response support.
- Mood check-in is not itself LLM analysis, but it can trigger an AI-generated diary greeting after the mood is saved.
- Insight generation converts mood logs and decrypted diary messages into structured JSON containing reflection, cognitive pattern, affirmation, and up to three recommendations.
- AI safety exists mainly as prompt-level guardrails and privacy filtering: no diagnosis, no professional-health claims, no dangerous instructions, crisis referral wording, JSON-only output rules, and source-leak fallback text.
- Rule-based/ML-adjacent features include ONNX baseline inference, BraveChoice question selection/scoring, dashboard mood aggregation, and recommendation priority sorting; these are not LLM features.
- Most useful interview points: validating the LLM chatbot workflow, prompt/safety design, encrypted chat history, AI insight generation, privacy-safe output handling, and identifying safety gaps for a mental wellness product.

## 2. AI Feature Inventory Table

| Feature / Flow | AI Capability | User Trigger | Input | Processing Logic | Prompt / Model | Output | Product Value | Implementation Status | Evidence: File Path + Function/Route/Component |
|---|---|---|---|---|---|---|---|---|---|
| TemanCerita AI diary chatbot | LLM-generated supportive chat replies. | User sends message in diary UI. | `entryId`, `messageText`, timezone, user profile, recent encrypted/decrypted messages. | Validates auth/payload, prepares diary session, decrypts history, builds prompt, calls model, encrypts user and AI messages, persists result. | `openai/gpt-5-mini` via OpenAI SDK and `https://api.koboillm.com/v1`; prompt in `buildDiaryPromptMessages`. | AI reply as JSON or streamed SSE chunks. | Gives immediate supportive reflection without a human operator. | Implemented LLM/AI feature. | `src/app/api/diary/chat/route.ts` `POST` lines 8-56; `src/app/api/diary/chat/stream/route.ts` `POST` lines 19-117; `src/lib/diary/service.ts` `prepareDiaryChatSession`, `persistDiaryChatSession`, `sendDiaryChatMessage` lines 200-648; `src/lib/diary/litellm.ts` `generateDiaryAssistantReply`, `generateDiaryAssistantReplyStream` lines 33-112. |
| Diary prompt engineering | Converts user and conversation context into safe assistant messages. | Called by chat and mood greeting services. | User name, today label, conversation turns. | Keeps last 24 turns, truncates each turn to 1200 chars, injects system prompt and context prompt. | `SYSTEM_PROMPT` in `src/lib/diary/prompt.ts`. | Array of `{ role, content }` messages. | Keeps assistant behavior consistent, warm, and safety-aware. | Implemented LLM support feature. | `src/lib/diary/prompt.ts` `SYSTEM_PROMPT`, `buildDiaryPromptMessages` lines 17-61; `tests/lib/diary/prompt.test.ts`. |
| Diary streaming response | Streams assistant answer while preserving final persistence. | User sends chat message via streaming endpoint. | Same chat payload as non-stream route. | Builds `ReadableStream`, yields model chunks as `event: chunk`, then persists full assistant text and sends `event: done`. | Same `openai/gpt-5-mini` model with `stream: true`. | Streaming chat UI events. | Improves perceived latency and chat UX. | Implemented LLM/AI feature. | `src/app/api/diary/chat/stream/route.ts` `POST` lines 50-96, `toSseChunk` lines 117-118; `tests/api/diary-chat-stream.test.ts`. |
| Mood-to-diary AI greeting | LLM-generated greeting seeded by daily mood. | Successful mood check-in when diary shell needs greeting. | Mood score, optional mood note, diary id, date/timezone. | Creates/ensures diary shell, builds prompt using mood description, calls LLM, encrypts AI message. | Shared diary prompt plus generated mood prompt in `generateDiaryGreetingFromMood`. | First AI diary message for that day. | Connects mood check-in to reflective conversation. | Implemented LLM/AI feature, triggered by mood flow. | `src/app/api/mood/route.ts` `POST` lines 99-114 and `scheduleAfterResponse` lines 152-169; `src/lib/diary/service.ts` `ensureDiaryShellFromMood`, `generateDiaryGreetingFromMood` lines 436-551. |
| Premium daily insight generation | LLM-generated wellness insight and recommendation JSON. | User clicks "Tampilkan Insight Hari Ini". | Date, timezone, mood logs, notes, decrypted diary messages. | Checks premium access, requires diary messages, builds prompt, calls OpenAI-compatible model, parses JSON, filters source leakage, saves insight/recommendations. | `openai/gpt-5-mini`; system message asks for valid JSON and privacy; `buildInsightPrompt` defines output schema. | `Insight` and `InsightRecommendation` rows. | Turns raw mood/journal data into actionable reflection. | Implemented LLM/AI feature. | `src/app/api/insight/generate/route.ts` `POST` lines 11-54; `src/lib/insight/service.ts` `generateDailyInsight`, `buildInsightPrompt`, `makePrivacySafeText` lines 103-422. |
| Insight dashboard AI display | Displays generated insight and prioritizes recommendation cards. | Insight page load or after generation. | Saved insights, recommendations, mood map. | Fetches `/api/insight` and `/api/mood`, computes chart data, sorts actions by priority. | No LLM call in UI; uses saved LLM output. | Reflection section, trend section, recommendation section. | Makes generated insight understandable to users. | Implemented AI-output consumption; not a model call. | `src/features/insight/components/InsightPageContent.tsx` `fetchInsightData`, `handleGenerateTodayInsight` lines 48-160; `InsightRecommendationSection` lines 58-69. |
| Privacy-safe insight filter | Guards against LLM copying raw mood notes/diary content. | During insight save. | Model text and sensitive source strings. | Normalizes text and checks if generated text contains raw source strings; substitutes fallback if leakage detected. | Rule-based post-processing; no separate model. | Safer saved reflection/action text. | Protects privacy in mental wellness context. | Implemented rule-based guardrail. | `src/lib/insight/service.ts` `makePrivacySafeText` lines 398-422; `tests/lib/insight/service.test.ts` lines 79-124. |
| Baseline onboarding classifier | ONNX ML inference; not LLM. | User submits baseline questionnaire. | 8 answer tuple. | Loads `baseline_model.onnx` through `onnxruntime-node`, maps label/probability to Beginner/Intermediate and confidence, upserts baseline. | ONNX model, not prompt-based. | Baseline label and confidence score. | Personalizes onboarding state. | Rule-based/ML feature, not LLM. | `src/lib/baseline/inference.ts` `runBaselineInference` lines 42-169; `src/lib/baseline/service.ts` `analyzeAndSaveBaseline` lines 75-120; `src/app/api/baseline/route.ts`. |
| BraveChoice safety quiz | Rule-based personalized quiz selection/scoring; not LLM. | User opens/submits BraveChoice. | User birth year/age segment, quiz logs, selected answer. | Resolves age segment, enforces quota, randomly selects unsolved active question, compares chosen answer to correct option, returns explanation. | Stored quiz content in DB/seed; no LLM. | Question, correctness, explanation, stats. | Personalized safety education. | Rule-based AI-adjacent logic, not LLM. | `src/lib/diary/brave-choice-service.ts` `getBraveChoiceQuizForUser`, `submitBraveChoiceAnswerForUser` lines 81-287; random selection lines 355-383. |
| Mood dashboard analytics | Rule-based mood summaries; not LLM. | Home/insight dashboard load. | Mood logs and dates. | Builds weekly calendar, computes longest streak, average/peak/low/stable days. | No model/prompt. | Dashboard cards and trend metrics. | Makes mood history interpretable. | Rule-based logic that looks AI-related but is not LLM. | `src/features/home/utils.ts` `buildWeeksFromLogs`, `computeLongestStreak` lines 45-143; `src/features/insight/lib/insight-utils.ts` lines 81-106. |
| AI testing/validation | Automated tests for prompts, LiteLLM parsing, streaming, and insight output. | Developer test run. | Mock model responses, API requests, service inputs. | Mocks OpenAI client, validates missing `API_KEY`, model output extraction, retry, streaming, insight structure, and route errors. | Test mocks, not production model. | Regression confidence. | Implemented test support. | `tests/lib/diary/litellm.test.ts`; `tests/lib/diary/prompt.test.ts`; `tests/api/diary-chat-stream.test.ts`; `tests/lib/insight/service.test.ts`; `tests/api/insight.test.ts`. |

## 3. AI Chatbot Flow

- User entry point: Diary pages under `src/app/(protected)/diary/page.tsx` and `src/app/(protected)/diary/[id]/page.tsx` render the diary client experience.
- Frontend component: `src/features/diary/components/DiaryPageClient.tsx` passes `diary.handleSendMessage` into `DiaryRightPage`; `DiaryRightPage` renders `ChatBubble` and `TypingIndicator` (`DiaryRightPage.tsx` lines 510-518).
- API route or backend function: The browser service `src/features/diary/services/diaryServices.ts` calls `/api/diary/chat/stream` with `entryId`, `messageText`, and timezone (lines 176-188). The API route is `src/app/api/diary/chat/stream/route.ts` `POST`; a non-stream fallback-style route also exists at `src/app/api/diary/chat/route.ts` `POST`.
- Message payload: `src/lib/diary/validation.ts` `diaryChatPayloadSchema` requires `messageText` between 1 and 5000 chars, defaults `entryId` to `"today"`, and accepts optional timezone.
- Prompt/system instruction: `src/lib/diary/prompt.ts` uses a warm supportive system prompt, max 24 turns, max 1200 chars per turn, user name, today label, and conversation history.
- Model/API provider: `src/lib/diary/litellm.ts` uses the `openai` package, `DEFAULT_BASE_URL = "https://api.koboillm.com/v1"`, `DEFAULT_MODEL = "openai/gpt-5-mini"`, `API_KEY`, and optional `BASE_URL`.
- Response handling: `generateDiaryAssistantReplyStream` calls `client.chat.completions.create` with `stream: true`, `temperature: 0.9`, `max_tokens: 1400`; the API route emits SSE chunks and persists the final response.
- Storage of chat history: `src/lib/diary/service.ts` decrypts existing messages for prompt context and encrypts new user/AI messages before storing them in `DiaryMessage` (`encrypt`/`decrypt` evidence lines 126-180, 285, 361, 375).
- Error/fallback behavior: Missing `API_KEY` throws `"API_KEY belum diatur."`; empty model output throws `"Model mengembalikan respons kosong."`; the stream route emits structured `error` SSE events; `toDiaryServiceErrorForAiFailure` maps auth/config/empty/AI-unavailable errors to `DiaryServiceError`.
- Safety guardrails: Prompt-level only. It instructs the assistant not to diagnose, not to claim to be a health professional, not to give dangerous instructions, and to direct self-harm/violence/emergency cases toward parents, guardians, trusted teachers, counselors, or local emergency services.
- UI display: `ChatBubble` distinguishes AI vs user messages and shows `AiAvatar`; `TypingIndicator` shows AI typing state.
- Missing parts: No code evidence was found for crisis keyword detection, content moderation API, human escalation, safety event logging, therapist/admin review queue, or user feedback scoring for AI answers.

## 4. Prompt Engineering Evidence

| File path | Prompt purpose | Input variables | Expected output | Risk handled | Product relevance |
|---|---|---|---|---|---|
| `src/lib/diary/prompt.ts` `SYSTEM_PROMPT` lines 20-31 | Define TemanCerita assistant role and tone. | None directly; static system message. | Warm, natural, supportive 1-4 sentence reply. | Avoids diagnosis, professional-health claims, dangerous instructions; gives emergency referral instruction. | Core chatbot behavior for mental wellness diary. |
| `src/lib/diary/prompt.ts` `buildDiaryPromptMessages` lines 33-61 | Compose model messages from user context and chat history. | `userName`, `todayLabel`, `conversation`. | `DiaryPromptMessage[]` with system + context + recent turns. | Controls context length with `MAX_HISTORY_TURNS` and `MAX_TURN_CHARS`. | Prevents unbounded prompt growth and personalizes the assistant. |
| `src/lib/diary/service.ts` `generateDiaryGreetingFromMood` lines 486-551 | Generate first diary greeting from mood check-in. | `moodScore`, `notes`, `diaryId`, `todayDate`, timezone. | AI greeting saved as encrypted `DiaryMessage`. | Uses shared diary guardrails; catches/logs generation errors. | Bridges mood check-in to AI journaling. |
| `src/lib/insight/service.ts` system message lines 189-197 | Tell the model to produce concise, privacy-preserving JSON. | Full prompt text passed as user message. | Valid JSON only. | Privacy-safe, no raw diary exposure, structured output. | Makes generated insight machine-parseable. |
| `src/lib/insight/service.ts` `buildInsightPrompt` lines 276-333 | Generate daily reflection, pattern, affirmation, recommendations. | Date key, mood logs, diary messages. | JSON with `averageScore`, `analysisText`, `cognitivePattern`, `affirmation`, `recommendations`. | No diagnosis; avoid names, locations, conflict details, personal data; max 3 recommendations. | Turns journal/mood data into product insight. |
| `src/lib/insight/service.ts` `makePrivacySafeText` lines 398-422 | Post-process model output for privacy leakage. | Generated text, sensitive sources, fallback text. | Original text or fallback. | Blocks direct copying of raw notes/diary text. | Supports safer parent/user-facing insight display. |

No prompt evidence was found for Gemini, Anthropic, LangChain, Vercel AI SDK, Hugging Face, or a separate moderation model.

## 5. Mental Wellness Safety and Guardrails

Implemented guardrails:

- Diary chatbot prompt says: do not provide clinical diagnosis, do not claim to be a health professional, and do not give dangerous instructions (`src/lib/diary/prompt.ts` lines 29-30).
- Diary chatbot prompt says that if the user mentions self-harm intent, violence, or emergency situations, the assistant should remain empathetic and direct them to parents, guardians, trusted teachers, counselors, or local emergency services (`src/lib/diary/prompt.ts` line 30).
- Insight prompt says the cognitive pattern should be general and explicitly says "Jangan memberi diagnosis" (`src/lib/insight/service.ts` line 313).
- Insight prompt requires privacy-safe summaries without quoting diary content, names, locations, detailed conflict, or personal data (`src/lib/insight/service.ts` line 312).
- `makePrivacySafeText` detects raw sensitive source leakage and replaces output with fallback text (`src/lib/insight/service.ts` lines 398-422).
- Non-functional tests assert insight privacy requirements and no-diagnosis prompt text (`tests/nfr/non-functional-requirements.test.ts` lines 74-83).

Serious gaps:

- No crisis keyword classifier or deterministic self-harm detection was found.
- No content moderation API or model call was found.
- No escalation logic to a guardian, counselor, admin, or emergency contact was found.
- No severity scoring, incident logging, or audit trail for high-risk AI conversations was found.
- No AI answer feedback loop, user rating, or human review workflow was found.
- No prompt versioning or safety-evaluation dataset was found.
- The chatbot relies on prompt compliance for crisis behavior; this is helpful but insufficient for a mental wellness product.

Recommended improvements:

- Add a pre-response crisis detector for self-harm, violence, abuse, emergency, and grooming/sexual exploitation indicators.
- Add deterministic emergency fallback copy that appears before or alongside LLM response for high-risk messages.
- Add a human escalation policy and product workflow, with explicit consent/privacy boundaries.
- Add safety event logging with minimal necessary data, retention policy, and admin access controls.
- Add offline evaluation cases for crisis prompts, hallucination, diagnosis, unsafe advice, and privacy leakage.
- Add user feedback on AI response helpfulness/safety and monitor failures over time.

## 6. Mood Check-in and Insight Generation

Mood check-in:

- Data collected: `moodScore` 1-5, optional note capped at 100 words, timezone (`src/lib/mood/validation.ts` `moodSubmitSchema` lines 10-22).
- Database storage: `MoodLog` stores `userId`, `moodScore`, `note`, `createdAt` (`prisma/schema.prisma` `MoodLog` lines 182-191).
- Analysis logic: `src/lib/mood/service.ts` `createMoodLog` checks last local-day log, blocks same-day duplicates, increments or resets `User.currentStreak`, and saves mood/user updates in a transaction.
- Dashboard output: `src/features/home/utils.ts` builds weekly mood cards and streaks; `src/features/insight/lib/insight-utils.ts` computes average, peak, low, and stable days.
- AI involvement: Mood check-in is rule-based, but successful check-in can schedule a mood-based LLM diary greeting through `generateDiaryGreetingFromMood`.

Insight generation:

- Data collected: Target date/timezone, user's mood logs, mood notes, and decrypted diary messages for the local date.
- Database storage: Generated `Insight` and nested `InsightRecommendation` rows (`prisma/schema.prisma` lines 273-298).
- Analysis logic: `src/lib/insight/service.ts` checks premium access, collects logs/messages, calls LLM, parses JSON, and saves structured output.
- Dashboard output: `InsightPageContent` fetches saved insights and mood, lets the user generate today's insight, and renders trend/reflection/recommendation sections.
- Recommendation/insight output: `analysisText`, `cognitivePattern`, `affirmation`, and up to three recommendations with `label`, `desc`, and priority.

## 7. Recommendation / Personalization Logic

- Mood history: Insight generation includes daily mood scores and notes in `buildInsightPrompt`; dashboards compute trends from mood logs.
- User profile: Diary prompt includes user name; BraveChoice resolves age segment from `birthYear`; baseline stores user category from ONNX inference.
- Journal entries: Diary chat uses recent conversation history; daily insight uses decrypted diary messages for the selected date.
- Chat history: `prepareDiaryChatSession` maps existing messages into `role: "assistant"` or `"user"` and feeds them into `buildDiaryPromptMessages`.
- Activity data: BraveChoice uses quiz logs to exclude solved questions, calculate usage/status, and compute stats.
- Subscription/payment status: `ensurePremiumAccess` gates insight generation by current premium status via `syncUserPremiumStatus`.
- Admin settings: Admin can manage BraveChoice quiz questions and user premium status, indirectly changing what users can access; no admin monitoring of AI/chat data was found.
- Recommendation sorting: `InsightRecommendationSection` sorts generated recommendations by `High`, `Medium`, `Low` priority using `PRIORITY_ORDER`.

## 8. Technical Stack Summary

- Framework: Next.js 16 with React 19, API routes/server components (`package.json` lines 46, 52-54).
- AI provider/model: OpenAI SDK (`openai` package) pointed to `https://api.koboillm.com/v1`, model `openai/gpt-5-mini` (`src/lib/diary/litellm.ts` lines 33-34; `src/lib/insight/service.ts` lines 9-10).
- ML model: `onnxruntime-node` with local `src/models/baseline_model.onnx` for baseline classification (`package.json` line 48; `src/lib/baseline/inference.ts` lines 42-79).
- Database: Prisma 7 with PostgreSQL adapter `@prisma/adapter-pg`; `DATABASE_URL` in `src/lib/prisma.ts` line 7; schema in `prisma/schema.prisma`.
- Auth: Better Auth with Prisma adapter and Google OAuth support (`src/lib/auth.ts` lines 1-9, 69-71, 345-346).
- API architecture: Next route handlers under `src/app/api/**`, with service logic in `src/lib/**`.
- Validation: Zod schemas for auth/mood/diary/baseline/parent consent (`package.json` line 62; validation files under `src/lib`).
- Relevant environment variables supported by code: `API_KEY`, `BASE_URL`, `DATABASE_URL`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, SMTP vars, Midtrans vars. `CRON_SECRET` exists for reports but is not AI-specific.
- Unsupported provider evidence: No code evidence for Gemini, Anthropic, LangChain, Vercel AI SDK, Hugging Face, Supabase AI/RPC/realtime, or a moderation provider.

## 9. Gaps and Improvement Opportunities

- Stronger safety guardrails: Add crisis detection before LLM calls and deterministic emergency handling.
- Hallucination handling: Add policies and tests for medical claims, diagnosis, exaggerated risk, and unsupported advice.
- Crisis detection: Create a classifier/ruleset for self-harm, violence, abuse, coercion, and emergency content.
- Human escalation: Define when to notify a trusted adult/counselor/admin and how consent/privacy are handled.
- Prompt versioning: Track prompt version with each generated message/insight for debugging and evaluation.
- Evaluation dataset: Build test cases for supportive tone, crisis safety, privacy leakage, Indonesian language quality, and recommendation usefulness.
- Feedback loop: Let users rate AI responses and insight usefulness; store aggregate quality metrics.
- AI response quality dashboard: Monitor empty responses, model errors, fallback rates, latency, and safety events.
- Cost monitoring: Track model usage per feature, token estimates, and premium/free boundaries.
- Latency optimization: Keep streaming for chat, consider background insight pre-generation only if privacy/cost constraints are clear.
- Privacy and data handling: Keep encryption, but add explicit policy for decrypted prompt use, retention, and parent-report boundaries.
- Admin monitoring of AI/chat data: No monitoring exists; if added, it should be privacy-preserving and role-restricted.

## 10. Interview-Ready Talking Points

- I helped validate an AI diary chatbot flow where a user message becomes a bounded, safety-aware prompt, receives an OpenAI-compatible model response, and is stored as encrypted chat history.
- I reviewed prompt engineering for a mental wellness assistant, including tone, response length, no-diagnosis constraints, and crisis referral instructions.
- I validated streaming chat behavior, where model chunks are sent through SSE and the final answer is persisted after generation.
- I reviewed an AI insight workflow where mood logs and diary messages are transformed into structured JSON for reflection, cognitive pattern, affirmation, and recommendations.
- I checked privacy guardrails where generated insights are filtered to avoid quoting raw diary or mood-note content.
- I distinguished true LLM features from AI-adjacent logic, such as ONNX baseline inference, BraveChoice quiz scoring, and rule-based dashboard summaries.
- I identified important AI safety gaps, including the lack of crisis keyword detection, moderation API, escalation workflow, and prompt versioning.
- I connected AI capability to product workflow: mood check-in can trigger an AI greeting, diary conversation powers support, and premium insight turns journal data into recommendations.
- I reviewed AI tests that mock OpenAI responses, missing API keys, empty model responses, streaming chunks, and insight JSON persistence.
- I framed AI feature quality around product value, safety, privacy, latency, and measurable feedback loops.

## 11. STAR Answer Drafts

### 1. "Tell me about your experience building or validating LLM features."

**Situation:** TemanTumbuh has AI-powered mental wellness features, especially a diary chatbot and premium daily insight generation.

**Task:** I needed to validate how the LLM features worked end to end and make sure I could explain the product workflow with real code evidence.

**Action:** I traced the diary flow from the frontend service calling `/api/diary/chat/stream`, through `prepareDiaryChatSession`, `buildDiaryPromptMessages`, the OpenAI-compatible model call, SSE streaming, and encrypted persistence. I also reviewed insight generation, where mood logs and diary messages are turned into strict JSON with privacy-safe post-processing.

**Result:** I could clearly explain how the product uses LLMs: the chatbot supports reflective conversation, while the insight feature generates structured wellness summaries and recommendations. I also identified product risks, like the need for stronger crisis detection and evaluation datasets.

### 2. "How do you think about AI safety in a mental wellness product?"

**Situation:** In a mental wellness app, AI responses can feel personal and sensitive, so safety cannot rely only on a good user experience.

**Task:** I reviewed whether TemanTumbuh's AI flows handled mental wellness safety, privacy, and fallback behavior.

**Action:** I found prompt guardrails that tell the chatbot not to diagnose, not to claim to be a professional, and to refer self-harm or emergency situations to trusted adults, counselors, or local emergency services. I also found insight rules that avoid diagnosis and avoid exposing raw diary details, plus a privacy filter that replaces generated text if it copies sensitive sources.

**Result:** My conclusion was balanced: the repo has a good first layer of prompt and privacy guardrails, but for a mental wellness product I would recommend crisis keyword detection, content moderation, human escalation policy, prompt versioning, and safety evaluation tests. That shows I think about AI safety as a product system, not only as prompt wording.

### 3. "How have you translated AI capability into a product workflow?"

**Situation:** Raw mood logs and diary entries are useful, but they are not automatically meaningful for users.

**Task:** The product needed AI to fit into natural user workflows rather than feel like a separate chatbot demo.

**Action:** I reviewed how TemanTumbuh connects AI to user journeys. Mood check-in can create a diary shell and trigger an AI greeting. Diary chat uses conversation context to keep support continuous. Premium insight uses mood and journal data to generate reflection, patterns, affirmations, and recommendations that appear in the dashboard.

**Result:** The AI capability becomes a product workflow: users check in, talk to the diary assistant, and later see structured insight from their own data. For a Product AI Management Intern role, I would explain this as translating LLM generation into clear triggers, inputs, outputs, safety constraints, and user value.
