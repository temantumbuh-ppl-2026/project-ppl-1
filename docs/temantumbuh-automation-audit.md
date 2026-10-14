# TemanTumbuh Automation Audit

Reviewed repository areas: `src/app/api/**` API routes, `src/lib/**` service/auth/AI/payment/email/database logic, `src/features/**` dashboard and insight UI logic, `src/components/**` user/admin components, `prisma/schema.prisma`, `prisma/migrations/**`, `prisma/seed.ts`, `scripts/set-admin.ts`, `vercel.json`, `package.json`, and `tests/**`.

## 1. Executive Summary

- Strongest automation: Vercel Cron triggers `/api/cron/weekly-parent-reports` every Saturday at `30 16 * * 6`, guarded by `CRON_SECRET`, then batch-sends parent report emails using mood and insight data.
- Strongest product workflow automation: Midtrans webhook notifications verify signatures, update local payment state, activate premium subscriptions, and resync `user.isPremium`.
- Strongest AI automation: diary chat and insight generation use OpenAI-compatible LiteLLM/Koboi LLM calls with prompt construction, response parsing, streaming, and error handling.
- Mood check-in automatically enforces one check-in per local day, updates streaks, creates/uses a diary shell, and schedules a background AI greeting after the response.
- Baseline onboarding runs an ONNX model (`baseline_model.onnx`) from user questionnaire answers, then upserts the inferred beginner/intermediate result.
- Role and onboarding guards automatically route users by auth state, admin role, profile completion, baseline completion, and daily mood requirement.
- Admin actions automate premium grants/removals, subscription/payment row creation, session invalidation, parent-link email flows, quiz CRUD, and dashboard aggregation.
- Best interview examples: Midtrans payment webhook automation, weekly parent report cron/email automation, AI diary chat, AI insight generation, baseline ONNX inference, and mood-to-diary background greeting.

## 2. Automation Inventory Table

| Automation Area | Description | Trigger | Input | Processing Logic | Output | User/Business Value | Implementation Status | Evidence: File Path + Function/Route/Component |
|---|---|---|---|---|---|---|---|---|
| AI diary chat | Generates empathetic AI assistant replies from diary conversation history. | User sends diary chat message. | `entryId`, `messageText`, timezone, encrypted prior messages. | Builds bounded prompt, calls OpenAI-compatible client, extracts text, encrypts user/AI messages, persists session. | AI reply, saved diary messages, optional streaming chunks. | Reduces manual support burden and gives immediate reflection support. | Fully implemented automation. | `src/app/api/diary/chat/route.ts` `POST`; `src/app/api/diary/chat/stream/route.ts` `POST` lines 43-67; `src/lib/diary/service.ts` `prepareDiaryChatSession`, `persistDiaryChatSession`, `sendDiaryChatMessage`; `src/lib/diary/litellm.ts` `generateDiaryAssistantReply`, `generateDiaryAssistantReplyStream` lines 33-90. |
| Diary prompt construction | Converts user context and recent conversation into a safe LLM prompt. | Diary chat or mood greeting calls prompt builder. | User name, date label, conversation turns. | Truncates to `MAX_HISTORY_TURNS = 24`, caps turn chars, injects safety/support system prompt. | Prompt messages for LLM. | Keeps AI behavior consistent and safer. | Fully implemented automation. | `src/lib/diary/prompt.ts` `buildDiaryPromptMessages` lines 17-61. |
| Mood check-in streaking | Saves daily mood and automatically updates user streak. | `POST /api/mood`. | Mood score, note, timezone. | Checks last local-day log, blocks duplicate same-day check-in, increments/resets streak, writes log and user in transaction. | Mood log and `currentStreak`. | Encourages consistency without manual tracking. | Fully implemented automation. | `src/app/api/mood/route.ts` `POST` lines 64-129; `src/lib/mood/service.ts` `createMoodLog` lines 57-100. |
| Mood-to-diary AI greeting | Automatically schedules a diary greeting after a mood check-in. | Successful mood check-in when diary shell needs greeting. | Mood score, mood note, diary shell, timezone. | Creates/ensures diary shell, schedules post-response task via Next `after()`, calls LLM, encrypts generated greeting. | AI greeting message in diary. | Turns mood input into immediate guided reflection. | Fully implemented automation. | `src/app/api/mood/route.ts` `scheduleAfterResponse` lines 99-169; `src/lib/diary/service.ts` `ensureDiaryShellFromMood`, `generateDiaryGreetingFromMood` lines 436-551. |
| Insight generation | Generates privacy-safe daily insight and recommendations from mood plus diary data. | User clicks "Tampilkan Insight Hari Ini"; `POST /api/insight/generate`. | Date, timezone, mood logs, decrypted diary messages. | Premium check, collects mood/diary, builds JSON-only prompt, calls `openai/gpt-5-mini`, parses JSON, redacts possible source leakage, saves insight/recommendations. | `Insight` row plus up to 3 `InsightRecommendation` rows. | Converts raw journaling into actionable reflection. | Fully implemented, user-triggered AI automation. | `src/app/api/insight/generate/route.ts` `POST` lines 13-40; `src/lib/insight/service.ts` `generateDailyInsight` lines 103-259, `buildInsightPrompt` lines 276-323, `makePrivacySafeText` lines 398-422. |
| Insight dashboard aggregation | Maps saved insights and mood logs into dashboard charts/cards. | Insight page load and client refetch. | `/api/insight`, `/api/mood`, selected date/month. | Fetches data, computes averages/peak/low/stable days, sorts recommendations by priority. | Trend chart, reflection, recommendation cards. | Makes wellness data easier to review. | Fully implemented automation. | `src/features/insight/components/InsightPageContent.tsx` `fetchInsightData`, `handleGenerateTodayInsight` lines 142-160; `InsightRecommendationSection` lines 58-69; `src/features/insight/lib/insight-utils.ts` aggregation helpers. |
| Midtrans Snap payment creation | Creates premium payment transaction and stores pending payment. | `POST /api/payment/create`. | Authenticated user, duration months. | Rejects duplicate pending payment, creates `Payment`, calls `snap.createTransaction`, saves Snap token. | Snap token/redirect URL and local pending payment. | Automates purchase initiation. | Fully implemented automation. | `src/app/api/payment/create/route.ts` `POST` lines 13-109; `src/lib/midtrans.ts` Snap config lines 3-9. |
| Midtrans webhook status sync | Verifies Midtrans callback and updates payment/subscription. | Midtrans posts `/api/payment/notification`. | `order_id`, `status_code`, `gross_amount`, `signature_key`, `transaction_status`, fraud data. | Computes SHA-512 signature, ignores stale non-settlement notifications, updates payment, activates subscription on settlement/capture accept, syncs premium on cancel/deny/expire. | Payment status, subscription row, `user.isPremium`. | Removes manual payment reconciliation. | Fully implemented automation. | `src/app/api/payment/notification/route.ts` `POST` lines 15-142; `src/lib/subscription/service.ts` `activateSubscription`, `syncUserPremiumStatus` lines 36-164. |
| Subscription auto-downgrade | Deactivates expired subscriptions and mirrors current access to `user.isPremium`. | `GET /api/subscription/status` and webhook/cancel flows. | User id and subscription dates. | Marks expired rows inactive, finds current active subscription, updates user premium flag. | Current subscription status and pending payment. | Keeps access accurate without manual cleanup. | Fully implemented automation. | `src/app/api/subscription/status/route.ts` `GET` lines 7-32; `src/lib/subscription/service.ts` `syncUserPremiumStatus`, `getSubscriptionStatus` lines 90-164. |
| Weekly parent reports cron | Sends weekly reports to verified parents. | Vercel Cron schedule `30 16 * * 6`. | Verified parent rows, user mood logs, insights, premium status. | Secret validates request, batches parents, builds weekly report, sends email/PDF depending plan, marks parent report status. | Parent email with basic report or premium PDF. | Automates recurring parent updates. | Fully implemented scheduled automation. | `vercel.json` lines 2-5; `src/app/api/cron/weekly-parent-reports/route.ts` `handleCron` lines 16-32; `src/lib/parent-report/service.ts` `sendWeeklyParentReports`, `sendWeeklyParentReportForUser` lines 102-269. |
| Manual parent report send | Reuses weekly report generator for an on-demand send. | User POSTs `/api/parent-report/send`. | Authenticated user, optional timezone. | Calls `sendWeeklyParentReportForUser` with `force: true`, returns skipped/sent message. | Parent report email or skip reason. | Gives user/admin a manual recovery path. | Manual flow that could become automation. | `src/app/api/parent-report/send/route.ts` `POST` lines 11-38. |
| Parent consent email workflow | Sends consent link and tracks pending/verified/rejected/expired parent status. | Parent email set during profile update/admin link. | Child/user id, child name, parent email, app URL. | Generates token, sends accept/reject email, upserts `Parent`, later accepts/rejects via token route. | Verified parent email or rejected/expired status. | Automates guardian consent collection. | Fully implemented automation. | `src/lib/auth.ts` `user.update.before` lines 122-196; `src/lib/parent-consent.ts` `requestParentConsentEmail` lines 6-198; `src/app/api/parent-consent/route.ts` `GET`/`POST` lines 41-242. |
| Parent status expiry | Converts pending expired consent links to expired status on status check. | `GET /api/parent/status`. | Parent row expiration date. | If pending and `expiresAt <= now`, updates row to expired, clears token. | Current parent status and reason. | Prevents stale consent links from staying pending. | Fully implemented automation. | `src/app/api/parent/status/route.ts` `GET` lines 44-62. |
| Baseline ML inference | Runs ONNX model to infer user baseline category. | `POST`/`PATCH /api/baseline`. | 8 questionnaire answers. | Validates answer tuple, loads cached `onnxruntime-node` session, runs model, maps label/confidence, upserts baseline. | Beginner/intermediate label and confidence. | Automates onboarding personalization. | Fully implemented ML automation. | `src/app/api/baseline/route.ts` `saveBaselineResult`, `POST`, `PATCH` lines 13-107; `src/lib/baseline/inference.ts` `runBaselineInference` lines 126-169; `src/lib/baseline/service.ts` `analyzeAndSaveBaseline` lines 75-120. |
| BraveChoice quiz selection | Selects age-appropriate safety quiz, enforces usage state, scores answer. | User requests/submits BraveChoice. | User birth year, quiz logs, question answer. | Resolves age segment, excludes solved questions, random-selects candidate, compares normalized answer, upserts quiz log. | Question, correctness, explanation, stats/status. | Automates personalized micro-learning. | Fully implemented automation. | `src/app/api/diary/brave-choice/route.ts` `GET`/`POST` lines 17-105; `src/lib/diary/brave-choice-service.ts` `getBraveChoiceQuizForUser`, `submitBraveChoiceAnswerForUser` lines 81-287. |
| Auth verification and reset emails | Better Auth sends email verification/reset links via SMTP. | Registration or forgot/reset password flow. | User email and Better Auth URLs. | `sendVerificationEmail` and `sendResetPassword` call email service. | Transactional email. | Automates account lifecycle. | Fully implemented automation. | `src/lib/auth.ts` `sendResetPassword` line 240, `sendVerificationEmail` line 282; `src/lib/email.ts` `sendEmail` lines 23-52. |
| Post-login routing | Determines next route after login based on role/profile/baseline/mood. | Login/post-login status check and server layouts. | Session user id. | Checks DB role, profile, baseline, and mood state; redirects accordingly. | `/admin`, `/register?completeProfile=1`, `/baseline`, `/mood`, or `/home`. | Removes manual navigation decisions. | Fully implemented automation. | `src/lib/get-post-login-redirect.ts` `getPostLoginRedirect` lines 57-87; `src/app/api/auth/post-login-status/route.ts` `GET` lines 9-17; `src/app/(main)/layout.tsx` redirects lines 28-75. |
| Admin aggregation | Builds admin dashboard summary automatically. | `GET /api/admin/overview`. | Admin session, database tables. | Counts users, premium users, active users, quiz questions/logs, age segments. | Admin overview metrics. | Reduces manual reporting work. | Fully implemented automation. | `src/app/api/admin/overview/route.ts` `GET` lines 6-69. |
| Admin premium/user actions | Admin server actions create/update/delete users, grant/revoke premium, invalidate sessions. | Admin action from UI. | User fields, premium/status flags. | Validates input, runs Prisma transactions, creates admin-grant payments/subscriptions, deactivates subscriptions, deletes sessions, revalidates paths. | Updated user/subscription state. | Automates operational admin tasks. | Fully implemented workflow automation. | `src/lib/admin/action.ts` `createUserAction`, `updateUserAction`, `toggleStatusAction`, `togglePremiumAction` lines 50-306. |
| Test/build automation | Generates Prisma client before install/build/test and runs automated tests. | `pnpm install`, `pnpm build`, `pnpm test`, CI/local commands. | Source code and tests. | `prisma generate`, Vitest, Playwright, ESLint, seed script. | Build/test results and generated client. | Reduces regression risk. | Fully implemented development automation. | `package.json` scripts lines 5-19; `tests/README.md` lines 3-12, 19-65; `vitest.config.mts`; `playwright.config.ts`; `prisma/seed.ts` lines 5-900. |

## 3. End-to-End Automated Product Flows

### Mood check-in to diary/dashboard/insight

- User action or system trigger: User submits daily mood via `POST /api/mood`.
- Backend/API route involved: `src/app/api/mood/route.ts` `POST` authenticates, validates payload, calls `createMoodLog`, creates/uses diary shell, and schedules `generateDiaryGreetingFromMood`.
- Database tables involved: `MoodLog`, `User.currentStreak`, `Diary`, `DiaryMessage`; later dashboard/insight also reads `Insight` and `InsightRecommendation`.
- AI or third-party service involved: LiteLLM/OpenAI-compatible client through `src/lib/diary/litellm.ts` for mood-based diary greeting.
- Output shown to user/admin: Mood saved response includes `currentStreak` and diary greeting status; dashboard uses `src/features/home/utils.ts` `buildWeeksFromLogs` and `computeLongestStreak`; insight page can generate reflection/recommendations from mood plus diary.
- Why this counts as automation: A single mood submission automatically validates timing, updates streak, prepares a diary entry, and may start an AI-generated support message after the HTTP response.

### AI chatbot flow

- User action or system trigger: User sends a TemanCerita diary chat message to `/api/diary/chat` or `/api/diary/chat/stream`.
- Backend/API route involved: `src/app/api/diary/chat/route.ts` `POST`; `src/app/api/diary/chat/stream/route.ts` `POST`.
- Database tables involved: `Diary`, `DiaryMessage`, `User`.
- AI or third-party service involved: `src/lib/diary/litellm.ts` creates an OpenAI client against `https://api.koboillm.com/v1` with model `openai/gpt-5-mini`.
- Output shown to user/admin: Assistant reply, either as JSON or SSE `chunk`/`done` events; messages are encrypted before persistence.
- Why this counts as automation: The system transforms user text plus conversation history into a prompt, calls an LLM, normalizes the reply, persists both sides, and streams output without human intervention.

### Payment/Midtrans status flow

- User action or system trigger: User creates payment; Midtrans later calls webhook.
- Backend/API route involved: `src/app/api/payment/create/route.ts` `POST`; `src/app/api/payment/notification/route.ts` `POST`; `src/app/api/subscription/status/route.ts` `GET`.
- Database tables involved: `Payment`, `Subscription`, `User`.
- AI or third-party service involved: Midtrans Snap and Midtrans notification signature.
- Output shown to user/admin: Snap token/redirect URL, premium active status, pending payment status, subscription expiry date.
- Why this counts as automation: Payment states automatically reconcile from gateway callbacks to local payment/subscription/user access state.

### Admin/user management flow

- User action or system trigger: Admin uses server actions or admin API dashboard.
- Backend/API route involved: `src/lib/admin/action.ts`, `src/lib/admin/quiz-action.ts`, `src/app/api/admin/overview/route.ts`, `src/app/api/admin/users/route.ts`, `src/app/api/admin/quiz/route.ts`.
- Database tables involved: `User`, `Payment`, `Subscription`, `Session`, `Parent`, `QuizQuestion`, `QuizLog`.
- AI or third-party service involved: Parent linking can trigger SMTP email via `requestParentConsentEmail`.
- Output shown to user/admin: Updated users, premium grants, inactive sessions, admin dashboards, quiz lists.
- Why this counts as automation: Admin operations perform multi-table updates and path revalidation from one action instead of manual DB maintenance.

### Authentication/role-based routing flow

- User action or system trigger: User accesses protected/main/admin pages or asks post-login status.
- Backend/API route involved: `src/lib/get-post-login-redirect.ts`, `src/app/(protected)/layout.tsx`, `src/app/(main)/layout.tsx`, `src/app/(admin)/admin/layout.tsx`, `src/lib/admin/require-admin.ts`.
- Database tables involved: `Session`, `User`, `Baseline`, `MoodLog`.
- AI or third-party service involved: Better Auth; Google provider configured in `src/lib/auth.ts`.
- Output shown to user/admin: Automatic redirect to login, admin, profile completion, baseline, mood, or home.
- Why this counts as automation: The app decides the correct next step from session and data state.

### Recommendation/generated content flow

- User action or system trigger: Premium user generates daily insight.
- Backend/API route involved: `src/app/api/insight/generate/route.ts`; service `src/lib/insight/service.ts`.
- Database tables involved: `MoodLog`, `Diary`, `DiaryMessage`, `Insight`, `InsightRecommendation`, `Subscription`, `User`.
- AI or third-party service involved: OpenAI-compatible `openai/gpt-5-mini`.
- Output shown to user/admin: Reflection, pattern, affirmation, prioritized recommendations.
- Why this counts as automation: Raw mood/journal data is transformed into structured, privacy-filtered recommendations.

## 4. AI-Related Automation

1. Diary chat assistant
   - Prompt/system instruction location: `src/lib/diary/prompt.ts` `SYSTEM_PROMPT` lines 20-31 and `buildDiaryPromptMessages` lines 33-61.
   - Model/API used: `src/lib/diary/litellm.ts` OpenAI client, `DEFAULT_BASE_URL = "https://api.koboillm.com/v1"`, `DEFAULT_MODEL = "openai/gpt-5-mini"` lines 33-35.
   - Input data: User name, date label, encrypted/decrypted recent diary messages, latest message.
   - Output format: Plain assistant text; stream route emits SSE `chunk`, `done`, and `error` events.
   - Error handling/fallback: Empty model responses throw service errors; streaming route sends structured `error` event; `toDiaryServiceErrorForAiFailure` maps API/config/empty response errors.
   - Product use: Reply shown in TemanCerita and persisted encrypted in `DiaryMessage`.

2. Mood check-in AI diary greeting
   - Prompt/system instruction location: `src/lib/diary/service.ts` `generateDiaryGreetingFromMood`, with generated user prompt at lines 511-517 plus the shared diary system prompt.
   - Model/API used: Same LiteLLM/OpenAI-compatible client in `src/lib/diary/litellm.ts`.
   - Input data: Mood score, optional note, diary id, date/timezone.
   - Output format: Assistant text encrypted into a diary message.
   - Error handling/fallback: `scheduleAfterResponse` logs background failures; `generateDiaryGreetingFromMood` catches and logs failures.
   - Product use: Initializes the diary after mood check-in.

3. Daily insight generation
   - Prompt/system instruction location: `src/lib/insight/service.ts` system message lines 194-196 and `buildInsightPrompt` lines 276-323.
   - Model/API used: OpenAI client at `src/lib/insight/service.ts` lines 1-18, model `openai/gpt-5-mini` lines 9-10 and 189-190.
   - Input data: Mood logs, notes, decrypted user diary messages for target local date.
   - Output format: Strict JSON with `analysisText`, `cognitivePattern`, `affirmation`, and `recommendations`.
   - Error handling/fallback: Requires premium via `ensurePremiumAccess`; requires diary messages; invalid/empty model output returns `InsightServiceError`; `makePrivacySafeText` replaces text that leaks raw sensitive sources.
   - Product use: Saves `Insight` and `InsightRecommendation` rows displayed on the insight dashboard and weekly parent reports.

4. Baseline ML inference
   - Prompt/system instruction location: Not prompt-based; uses ONNX model `src/models/baseline_model.onnx`.
   - Model/API used: `onnxruntime-node` in `src/lib/baseline/inference.ts`.
   - Input data: 8 baseline questionnaire answers validated by `src/lib/baseline/validation.ts`.
   - Output format: `label`, `labelIndex`, `confidenceScore`, `isBeginner`.
   - Error handling/fallback: Throws if model file/output names/label/probability are invalid.
   - Product use: Stores onboarding baseline in `Baseline` table and controls routing into the main app.

## 5. Payment / Midtrans Automation

- Payment creation flow: `src/app/api/payment/create/route.ts` `POST` authenticates user, validates duration, prevents duplicate pending payment via `getLatestPendingPayment`, creates a local `Payment`, calls `snap.createTransaction`, and updates the payment with `snapToken`.
- Callback/webhook flow: `src/app/api/payment/notification/route.ts` `POST` receives Midtrans notification payload and verifies `signature_key` against SHA-512 of `order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY`.
- Status update flow: The webhook updates `Payment.status` to settlement/capture/challenge/cancel/deny/expire/pending depending `transaction_status` and `fraud_status`.
- Database update flow: Settlement or accepted capture calls `activateSubscription`, which deactivates prior active subscriptions, creates a new `Subscription`, and sets `User.isPremium = true`; cancel/deny/expire calls `syncUserPremiumStatus`.
- User-facing result: `GET /api/subscription/status` returns `isPremium`, active subscription window, active subscription count, pending payment, and renewal availability; `SubscriptionClient` can cancel pending payment through `/api/payment/cancel`.
- Evidence paths: `src/app/api/payment/create/route.ts` `POST` lines 13-109; `src/app/api/payment/notification/route.ts` `POST` lines 15-142; `src/app/api/payment/cancel/route.ts` `POST` lines 37-77; `src/lib/subscription/service.ts` `activateSubscription` and `syncUserPremiumStatus` lines 36-164; `src/app/api/subscription/status/route.ts` `GET` lines 7-32.

## 6. Database / Supabase Automation

- Tables: Prisma models define `User`, `Parent`, `Session`, `Account`, `Verification`, `Payment`, `Subscription`, `Baseline`, `MoodLog`, `Diary`, `DiaryMessage`, `QuizQuestion`, `QuizLog`, `Insight`, and `InsightRecommendation` in `prisma/schema.prisma` lines 25-298.
- Automated inserts/updates:
  - Mood check-in writes `MoodLog` and updates `User.currentStreak` in a Prisma transaction: `src/lib/mood/service.ts` `createMoodLog` lines 85-100.
  - Payment webhook updates `Payment` and creates `Subscription`: `src/app/api/payment/notification/route.ts` lines 98-130.
  - Insight generation creates `Insight` and nested `InsightRecommendation`: `src/lib/insight/service.ts` lines 217-259.
  - Parent consent upserts/updates `Parent` and `User.parentEmail`: `src/lib/parent-consent.ts` lines 172-198; `src/app/api/parent-consent/route.ts` lines 113-132.
  - Admin premium grants create synthetic `Payment`/`Subscription` rows: `src/lib/admin/action.ts` lines 91-104, 156-169, 277-290.
- Role-based access: Admin routes check session plus DB role before returning data or rendering admin layout: `src/lib/admin/require-admin.ts` lines 10-34; `src/app/api/admin/overview/route.ts` lines 8-22.
- Cascades/indexes: Prisma schema uses `onDelete: Cascade` on user-owned relations and indexes on parent/payment/subscription/log relations: `prisma/schema.prisma` lines 56-298.
- Supabase-specific findings: No supported code evidence found for Supabase client usage, RPC calls, realtime subscriptions, RLS policies, SQL triggers, or Supabase edge/functions. The repository uses Prisma/Postgres-style schema/migrations and Better Auth/Prisma data access.

## 7. Testing / Validation / UAT Evidence

- Automated test organization: `tests/README.md` states the suite covers API routes, service/helper logic, non-functional requirements, and Playwright E2E smoke tests lines 3-12.
- Test commands: `package.json` defines `test`, `test:coverage`, `test:e2e`, `lint`, and Prisma-generation hooks lines 5-19.
- Payment webhook tests: `tests/api/payment-cancel-notification.test.ts` covers invalid signature, missing payment, settlement activation, capture/fraud handling, cancel/expire sync, pending updates, and idempotency lines 207-420.
- Insight tests: `tests/api/insight.test.ts` covers unauthenticated requests and no-diary-message validation lines 43, 115, 232-236.
- Diary streaming tests: `tests/api/diary-chat-stream.test.ts` covers unauthorized, validation, streaming, service errors, and persistence interactions lines 77-246.
- Validation schemas: `src/lib/validations.ts`, `src/lib/mood/validation.ts`, `src/lib/diary/validation.ts`, and `src/lib/baseline/validation.ts` enforce email/password, mood score/note length, chat message length, BraveChoice payload, parent consent token/decision, and baseline answer shape.
- Non-functional validation: `tests/nfr/non-functional-requirements.test.ts` checks security headers, email verification settings, account linking, diary encryption usage, insight privacy constraints, input-validation performance, and browser coverage.
- QA/UAT relevance: Existing docs `docs/functional-testing.csv`, `docs/unit-testing.csv`, `docs/non-functional-testing.md`, and `docs/requirement-traceability-matrix.md` provide systematic feature-testing evidence.

## 8. Gaps and Opportunities

### Quick wins

- Add cron/test coverage for `/api/cron/weekly-parent-reports`; current tests cover manual parent report send but no direct cron-secret path was found.
- Add a small audit log table for payment webhook events so payment disputes can be traced beyond current console logs.
- Add explicit validation schema for `/api/payment/create` duration months rather than route-local numeric checks.
- Add user-facing retry/fallback copy for background mood-to-diary greeting failures, since failures are currently logged only.

### Medium-term improvements

- Add queue-backed background jobs for AI greeting and weekly emails; current code uses Next `after()` or request-time cron processing.
- Add scheduled subscription cleanup independent of `/api/subscription/status`, so expired premium access is synced even if the user does not visit subscription pages.
- Add monitoring/alerts for parent report send failures and Midtrans webhook failures.
- Add admin dashboard event history for premium grants/revokes, parent link actions, and automated report delivery status.

### Advanced automation opportunities

- Add proactive, opt-in reminders for missed mood check-ins using email/push/WhatsApp, with safety-aware frequency limits.
- Generate weekly parent summaries with a privacy-safe AI summarizer over approved insight fields, not raw diary text.
- Add human-in-the-loop escalation rules for high-risk diary content, if policy and consent requirements are defined.
- Add realtime status updates for payment completion and report delivery if the product adopts Supabase realtime or WebSocket infrastructure.

## 9. Interview-Ready Talking Points

- I validated Midtrans payment automation, where a webhook automatically verifies signatures, updates transaction status, activates subscriptions, and syncs premium access, resulting in less manual payment reconciliation.
- I contributed to AI diary workflow validation, where a user message automatically becomes a bounded safety-aware prompt, receives an LLM response, and stores encrypted conversation history, resulting in immediate supportive reflection.
- I validated mood check-in automation, where a daily mood submission automatically updates streaks and prepares a diary session, resulting in a smoother check-in-to-reflection journey.
- I worked with AI insight automation, where premium users can trigger privacy-safe daily summaries and recommendations from mood and diary data, resulting in more actionable self-reflection.
- I reviewed scheduled parent-report automation, where Vercel Cron automatically sends weekly mood/insight reports to verified parents, resulting in recurring caregiver updates without manual work.
- I validated baseline onboarding automation, where questionnaire answers automatically run through an ONNX model and store a beginner/intermediate result, resulting in personalized onboarding.
- I reviewed role-based routing automation, where the app automatically redirects users based on admin role, profile completion, baseline completion, and mood status, resulting in fewer dead-end user journeys.
- I validated admin operations automation, where admin premium toggles automatically create or deactivate subscription records and invalidate sessions, resulting in safer operational control.
- I reviewed parent consent automation, where setting a parent email automatically sends accept/reject links and updates verification status, resulting in a more scalable consent workflow.
- I mapped automated validation coverage, where Vitest, Playwright, schemas, and NFR tests protect payment, insight, diary, auth, and validation flows, resulting in stronger regression confidence.

## 10. STAR Answer Draft

### 1. "Tell me about your automation experience."

**Situation:** In TemanTumbuh, several workflows could not rely on manual follow-up: premium subscription activation, weekly parent updates, onboarding classification, and user routing all needed to respond to user or system events reliably.

**Task:** I needed to validate where automation existed in the codebase and make sure the flows were evidence-backed, especially payment status updates, parent reporting, mood tracking, and AI-assisted support.

**Action:** I reviewed the API routes and service layer. For payments, I traced `/api/payment/create`, `/api/payment/notification`, and the subscription service to confirm that Midtrans callbacks verify signatures, update payment status, create subscription rows, and sync `user.isPremium`. For parent reports, I traced Vercel Cron to `/api/cron/weekly-parent-reports`, then into `sendWeeklyParentReports` and the email/PDF generator. I also reviewed auth guards, baseline inference, and automated test coverage.

**Result:** I was able to explain TemanTumbuh's automation clearly: user events or scheduled triggers automatically update database state, generate AI or report outputs, and route users to the right next step. The strongest examples are payment webhook automation and weekly parent report automation because they connect product value, backend reliability, and business operations.

### 2. "How have you used automation or AI to improve a product workflow?"

**Situation:** TemanTumbuh includes reflective mental-wellness features, but raw mood logs and diary entries are not always easy for users to interpret on their own.

**Task:** The goal was to make reflection more helpful while preserving privacy and safety, without requiring a human to manually read or summarize user diary content.

**Action:** I reviewed the AI diary and insight implementation. The diary flow builds a supportive system prompt, limits recent conversation history, calls an OpenAI-compatible model, streams or returns the assistant reply, and encrypts saved messages. The insight flow checks premium access, gathers mood logs and decrypted diary messages for a selected date, asks the model for strict JSON, saves reflection/pattern/affirmation/recommendations, and filters outputs that appear to leak raw sensitive sources.

**Result:** The product turns manual journaling into automated support: users receive immediate AI conversation in TemanCerita and can generate privacy-safe daily insights with recommendations. I would describe this as AI-assisted workflow automation because the user still controls the trigger, but the system performs the analysis, generation, formatting, and persistence automatically.
