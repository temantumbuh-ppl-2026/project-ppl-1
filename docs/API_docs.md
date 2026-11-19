# API Documentation

This document provides a comprehensive overview of the available API endpoints for the TemanTumbuh application.

## Table of Contents
1. Auth API (better-auth)
2. Baseline API
3. Diary API
4. Mood API
5. Profile API
6. Payment API
7. Subscription API
8. Insight API
9. Admin API

---

## 1. Auth API (better-auth)

Authentication is handled by the `better-auth` library via the `/api/auth/*` routes. Below are the common standard endpoints exposed by `better-auth`.

### 1.1 Sign Up with Email
- **Endpoint**: `POST /api/auth/sign-up/email`
- **Description**: Registers a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "User Name"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "createdAt": "2026-04-25T10:00:00.000Z",
    "updatedAt": "2026-04-25T10:00:00.000Z"
  },
  "session": {
    "id": "uuid",
    "userId": "uuid",
    "expiresAt": "2026-05-25T10:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Email already exists"
}
```

### 1.2 Sign In with Email
- **Endpoint**: `POST /api/auth/sign-in/email`
- **Description**: Authenticates an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com"
  },
  "session": {
    "id": "uuid",
    "userId": "uuid",
    "expiresAt": "2026-05-25T10:00:00.000Z"
  }
}
```

**Response (400 / 401 Error):**
```json
{
  "message": "Invalid email or password"
}
```

### 1.3 Sign Out
- **Endpoint**: `POST /api/auth/sign-out`
- **Description**: Logs out the current user and invalidates the session.
- **Authentication**: Required

**Response (200 OK):**
```json
{
  "success": true
}
```

### 1.4 Get Session
- **Endpoint**: `GET /api/auth/get-session`
- **Description**: Retrieves the active user session.

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com"
  },
  "session": {
    "id": "uuid",
    "userId": "uuid",
    "expiresAt": "2026-05-25T10:00:00.000Z"
  }
}
```

**Response (401 Unauthorized - Not Logged In):**
```json
null
```

---

### 1.5 Check Email
- **Endpoint**: `POST /api/auth/check-email`
- **Description**: Checks whether a given email address is already registered in the system. Used on the registration form to show inline feedback before submission.
- **Authentication**: Not required

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "exists": true
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Email diperlukan."
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan."
}
```

### 1.6 Get Post-Login Status
- **Endpoint**: `GET /api/auth/post-login-status`
- **Description**: Determines where to redirect the user after login based on their profile completion state. Returns `isAuthenticated` and `nextRoute`.
- **Authentication**: Optional

**Response (200 OK - Authenticated):**
```json
{
  "isAuthenticated": true,
  "nextRoute": "/diary"
}
```

**Response (200 OK - Not Authenticated):**
```json
{
  "isAuthenticated": false,
  "nextRoute": "/login"
}
```

---

## 2. Baseline API

These endpoints handle the user's psychological or developmental baseline assessments.

### 2.1 Get Baseline
- **Endpoint**: `GET /api/baseline`
- **Description**: Returns the saved baseline result for the logged-in user.
- **Authentication**: Required (Cookie/Session)

**Response (200 OK):**
```json
{
  "success": true,
  "baseline": {
    "id": "uuid",
    "userId": "uuid",
    "score": 85,
    "createdAt": "2026-04-25T10:00:00Z"
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil baseline."
}
```

### 2.2 Submit Baseline
- **Endpoint**: `POST /api/baseline`
- **Description**: Runs inference and stores the first baseline result for the logged-in user.
- **Authentication**: Required (Cookie/Session)

**Request Body:**
```json
{
  "answers": ["Agree", "Agree", "Agree", "Agree", "Yes", "Yes", "Yes", "Yes"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "baseline": {
    "id": "uuid",
    "userId": "uuid"
  },
  "prediction": {
    "labelIndex": 1,
    "label": "Moderate",
    "isBeginner": true,
    "confidenceScore": 0.89,
    "inputName": "input_1"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Payload baseline tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat memproses baseline."
}
```

### 2.3 Update Baseline
- **Endpoint**: `PATCH /api/baseline`
- **Description**: Re-runs baseline inference and overwrites the saved result for the logged-in user.
- **Authentication**: Required (Cookie/Session)
- **Request Body**: Same as `POST /api/baseline`
- **Response**: Same as `POST /api/baseline` with same error scenarios.

---

## 3. Diary API

These endpoints handle user diary entries and AI chat functionality.

### 3.1 Get Diary Entries
- **Endpoint**: `GET /api/diary`
- **Description**: Retrieves a list of diary entries for a specific month.
- **Authentication**: Required
- **Query Parameters**:
  - `month` (Required): Format `YYYY-MM`
  - `timezone` (Optional): e.g., `Asia/Jakarta`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "entry-uuid",
      "date": "2026-04-20",
      "preview": "Hari ini sangat menyenangkan..."
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Parameter diary tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil riwayat diary."
}
```

### 3.2 Get Total Diary Count
- **Endpoint**: `GET /api/diary/count`
- **Description**: Retrieves the total number of diary entries created by the user.
- **Authentication**: Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "count": 42
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Kamu harus login dulu."
}
```

**Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Gagal mengambil total diary."
}
```

### 3.3 Get Diary Messages
- **Endpoint**: `GET /api/diary/:entryId/messages`
- **Description**: Retrieves the chat history/messages for a specific diary entry.
- **Authentication**: Required
- **Query Parameters**:
  - `timezone` (Optional): e.g., `Asia/Jakarta`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "Halo, saya merasa sedikit sedih hari ini.",
        "createdAt": "2026-04-25T10:00:00Z"
      },
      {
        "role": "assistant",
        "content": "Halo! Saya di sini untuk mendengarkan. Ada yang ingin kamu ceritakan lebih lanjut?",
        "createdAt": "2026-04-25T10:00:05Z"
      }
    ]
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Parameter query diary tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil percakapan diary."
}
```

### 3.4 Send Diary Chat Message
- **Endpoint**: `POST /api/diary/chat`
- **Description**: Sends a message to the AI diary assistant and receives a synchronous response.
- **Authentication**: Required

**Request Body:**
```json
{
  "entryId": "entry-uuid",
  "messageText": "Saya tadi bertengkar dengan teman.",
  "timezone": "Asia/Jakarta"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reply": "Maaf mendengar itu. Apakah kamu ingin menceritakan apa yang terjadi?"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Payload chat diary tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat memproses chat diary."
}
```

### 3.5 Send Diary Chat Message (Stream)
- **Endpoint**: `POST /api/diary/chat/stream`
- **Description**: Streams the AI diary assistant's response via Server-Sent Events (SSE).
- **Authentication**: Required

**Request Body:**
```json
{
  "entryId": "entry-uuid",
  "messageText": "Saya tadi bertengkar dengan teman.",
  "timezone": "Asia/Jakarta"
}
```

**Response (200 OK - Text/Event-Stream):**
```text
event: chunk
data: {"text": "Maaf"}

event: chunk
data: {"text": " mendengar itu."}

event: done
data: {"success": true}
```

**Response (400 Bad Request):**
```json
{
  "error": "Payload chat diary tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat memproses chat diary stream."
}
```

### 3.6 Get BraveChoice Quiz
- **Endpoint**: `GET /api/diary/brave-choice`
- **Description**: Retrieves one BraveChoice question for the logged-in user. Questions already answered correctly by the same user are excluded. For free users, usage is limited to **5 attempts per day**.
- **Authentication**: Required
- **Query Parameters**:
  - `timezone` (Optional): e.g., `Asia/Jakarta`

**Response (200 OK - Question Available):**
```json
{
  "success": true,
  "data": {
    "quiz": {
      "id": "question-uuid",
      "category": "Bullying",
      "scenario": "Temanmu diejek di grup kelas.",
      "options": [
        {
          "label": "A",
          "text": "Membela teman",
          "isBrave": true
        },
        {
          "label": "B",
          "text": "Diam saja",
          "isBrave": false
        }
      ],
      "explanationWrong": "Diam memperkuat perilaku pelaku.",
      "explanationRight": "Membela teman adalah pilihan yang tepat."
    },
    "quizUsedToday": 1,
    "isQuotaReached": false
  }
}
```

**Response (200 OK - Quota Reached / No Question Left):**
```json
{
  "success": true,
  "data": {
    "quiz": null,
    "quizUsedToday": 5,
    "isQuotaReached": true
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil soal BraveChoice."
}
```

### 3.7 Submit BraveChoice Answer
- **Endpoint**: `POST /api/diary/brave-choice`
- **Description**: Submits the selected option for a BraveChoice question. The user-question status is stored as a single row (not append-only), so `isCorrect` can evolve from `false` to `true`.
- **Authentication**: Required

**Request Body:**
```json
{
  "questionId": "question-uuid",
  "chosenOption": "A",
  "timezone": "Asia/Jakarta"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "questionId": "question-uuid",
    "chosenOption": "A",
    "isCorrect": true,
    "explanation": "Membela teman adalah pilihan yang tepat.",
    "quizUsedToday": 2
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Pilihan jawaban harus A atau B.",
  "code": "INVALID_OPTION"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Batas 5 soal BraveChoice per hari sudah tercapai.",
  "code": "QUIZ_QUOTA_EXCEEDED"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Soal BraveChoice tidak ditemukan.",
  "code": "QUESTION_NOT_FOUND"
}
```

### 3.8 Reset BraveChoice Progress
- **Endpoint**: `POST /api/diary/brave-choice/reset`
- **Description**: Resets BraveChoice progress for the current user by setting all stored BraveChoice statuses back to `isCorrect = false`, making all questions available again.
- **Authentication**: Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resetCount": 15
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mereset progres BraveChoice."
}
```

### 3.9 Get BraveChoice Status
- **Endpoint**: `GET /api/diary/brave-choice/status`
- **Description**: Returns current BraveChoice usage status for the logged-in user (used count today, quota state, and whether there are still unanswered question candidates).
- **Authentication**: Required
- **Query Parameters**:
  - `timezone` (Optional): e.g., `Asia/Jakarta`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "quizUsedToday": 5,
    "isQuotaReached": true,
    "hasAvailableQuestion": false
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil status BraveChoice."
}
```

}
```

### 3.10 Get BraveChoice Stats
- **Endpoint**: `GET /api/diary/brave-choice/stats`
- **Description**: Returns the user's BraveChoice statistics, including total questions answered, total correct, and accuracy percentage. This is used for the dashboard card.
- **Authentication**: Required
- **Query Parameters**: None

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "correct": 22,
    "total": 25,
    "pct": 88
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Internal Server Error"
}
```

---

## 4. Mood API

These endpoints handle the daily mood check-in tracking.

### 4.1 Get Mood History
- **Endpoint**: `GET /api/mood`
- **Description**: Retrieves mood logs.
- **Authentication**: Required
- **Query Parameters**:
  - `date` (Optional): `YYYY-MM-DD`
  - `timezone` (Optional): e.g., `Asia/Jakarta`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "mood-uuid",
      "moodScore": 4,
      "note": "Hari yang produktif",
      "createdAt": "2026-04-25T08:00:00Z"
    }
  ]
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Parameter query mood tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil riwayat mood."
}
```

### 4.2 Submit Daily Mood
- **Endpoint**: `POST /api/mood`
- **Description**: Submits the mood check-in for the current day. Can only be done once per day.
- **Authentication**: Required

**Request Body:**
```json
{
  "moodScore": 5,
  "note": "Sangat bahagia hari ini!",
  "timezone": "Asia/Jakarta"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Mood berhasil disubmit.",
  "data": {
    "mood": {
      "id": "mood-uuid",
      "moodScore": 5,
      "note": "Sangat bahagia hari ini!"
    },
    "currentStreak": 3
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Payload mood tidak valid."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Kamu sudah mengisi mood check-in hari ini."
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat menyimpan mood."
}
```

### 4.3 Evaluate Streak
- **Endpoint**: `PATCH /api/mood/streak`
- **Description**: Evaluates if the user's streak needs to be reset due to missed days.
- **Authentication**: Required

**Request Body:**
```json
{
  "timezone": "Asia/Jakarta"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Proses evaluasi streak selesai dijalankan."
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Timezone identifier (misal: Asia/Jakarta) diperlukan."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat memproses reset streak."
}
```

---

## 5. Profile API

### 5.1 Get Security State
- **Endpoint**: `GET /api/profile/security-state`
- **Description**: Retrieves the user's account security state (password existence, linked providers).
- **Authentication**: Required

**Response (200 OK):**
```json
{
  "success": true,
  "hasPassword": true,
  "isGoogleLinked": false,
  "providerIds": ["credential"]
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil status keamanan akun."
}
```

---

## 6. Payment API

These endpoints handle Midtrans Snap payment creation, cancellation, and webhook updates.

### 6.1 Create Premium Payment
- **Endpoint**: `POST /api/payment/create`
- **Description**: Creates a Midtrans Snap transaction for a premium subscription.
- **Authentication**: Required
- **Important Flow Rule**: If the user already has a pending payment, this endpoint does not create a second payment. The client must continue or cancel the pending payment first.

**Request Body:**
```json
{
  "durationMonths": 3
}
```

Allowed durations: `1`, `3`, `6`, `12`.

**Response (200 OK):**
```json
{
  "success": true,
  "token": "midtrans-snap-token",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/...",
  "orderId": "TT-userid-1770000000000"
}
```

**Response (409 Conflict - Pending Payment Exists):**
```json
{
  "error": "Masih ada pembayaran yang sedang diproses. Lanjutkan atau batalkan pembayaran tersebut terlebih dahulu.",
  "code": "PENDING_PAYMENT_EXISTS",
  "pendingPayment": {
    "id": "payment-id",
    "orderId": "TT-userid-1770000000000",
    "token": "midtrans-snap-token",
    "durationMonths": 3,
    "grossAmount": "177000",
    "status": "pending",
    "createdAt": "2026-04-25T10:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Durasi tidak valid. Pilih 1, 3, 6, atau 12 bulan."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat membuat transaksi pembayaran."
}
```

### 6.2 Cancel Pending Payment
- **Endpoint**: `POST /api/payment/cancel`
- **Description**: Cancels the logged-in user's latest pending payment in Midtrans and marks the local payment as `cancel`.
- **Authentication**: Required

**Response (200 OK):**
```json
{
  "success": true,
  "cancelledPayment": {
    "id": "payment-id",
    "orderId": "TT-userid-1770000000000"
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "Tidak ada pembayaran tertunda."
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat membatalkan pembayaran."
}
```

### 6.3 Midtrans Payment Notification
- **Endpoint**: `POST /api/payment/notification`
- **Description**: Receives Midtrans webhook notifications, verifies the signature, updates payment status, activates premium on `settlement`/accepted `capture`, and resyncs `user.isPremium` when payments expire/cancel/deny.
- **Authentication**: Midtrans signature (`signature_key`)

**Request Body (Midtrans example):**
```json
{
  "order_id": "TT-userid-1770000000000",
  "status_code": "200",
  "gross_amount": "177000.00",
  "signature_key": "sha512-signature",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "payment_type": "bank_transfer",
  "va_numbers": [
    {
      "bank": "bca",
      "va_number": "1234567890"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Invalid signature"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Payment not found"
}
```

---

## 7. Subscription API

### 7.1 Get Subscription Status
- **Endpoint**: `GET /api/subscription/status`
- **Description**: Returns the logged-in user's premium status, active subscription window, active subscription count, pending payment, and renewal availability. This endpoint also deactivates expired subscriptions and updates `user.isPremium` based on current subscription data.
- **Authentication**: Required

**Response (200 OK):**
```json
{
  "success": true,
  "isPremium": true,
  "subscription": {
    "id": "subscription-id",
    "startedAt": "2026-04-25T10:00:00.000Z",
    "expiresAt": "2026-07-25T10:00:00.000Z",
    "isActive": true
  },
  "activeSubscriptionCount": 1,
  "premiumUntil": "2026-07-25T10:00:00.000Z",
  "pendingPayment": null,
  "canRenew": true
}
```

**Response (200 OK - Pending Payment):**
```json
{
  "success": true,
  "isPremium": false,
  "subscription": null,
  "activeSubscriptionCount": 0,
  "premiumUntil": null,
  "pendingPayment": {
    "id": "payment-id",
    "orderId": "TT-userid-1770000000000",
    "grossAmount": "59000",
    "status": "pending",
    "snapToken": "midtrans-snap-token",
    "durationMonths": 1,
    "createdAt": "2026-04-25T10:00:00.000Z"
  },
  "canRenew": false
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat mengambil status langganan."
}
```

---

## 8. Insight API

These endpoints handle premium daily insight summaries. Insight generation uses the user's timezone date key, mood check-ins, notes, and decrypted TemanCerita messages. Generated summaries must stay privacy-safe and avoid exposing diary details.

### 8.1 Get Insight Map
- **Endpoint**: `GET /api/insight`
- **Description**: Returns saved daily insights mapped by `YYYY-MM-DD`.
- **Authentication**: Required
- **Premium**: Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "2026-04-26": {
      "mood": 3.6,
      "reflection": "Hari ini terasa cukup stabil, meski ada beberapa bagian yang butuh jeda.",
      "pattern": "Ada pola menahan emosi lalu mencoba merapikannya lewat cerita.",
      "affirmation": "Kamu boleh berjalan pelan sambil tetap menjaga dirimu.",
      "actions": [
        {
          "priority": "Medium",
          "label": "Ambil jeda singkat",
          "desc": "Luangkan beberapa menit untuk menenangkan napas sebelum lanjut beraktivitas."
        }
      ]
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Membutuhkan premium account",
  "code": "PREMIUM_REQUIRED"
}
```

### 8.2 Generate Daily Insight
- **Endpoint**: `POST /api/insight/generate`
- **Description**: Generates one daily insight for the requested local date. The date is interpreted with the submitted timezone.
- **Authentication**: Required
- **Premium**: Required

**Request Body:**
```json
{
  "date": "2026-04-26",
  "timezone": "Asia/Jakarta"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "insight-id",
    "userId": "user-id",
    "date": "2026-04-26T00:00:00.000Z",
    "averageScore": "3.6",
    "analysisText": "Hari ini terasa cukup stabil.",
    "cognitivePattern": "Ada pola menahan emosi lalu mencoba merapikannya.",
    "affirmation": "Kamu boleh berjalan pelan sambil tetap menjaga dirimu.",
    "recommendations": []
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Harus ada minimal percakapan di dalam TemanCerita untuk generate insight tanggal ini.",
  "code": "NO_DIARY_MESSAGES"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Membutuhkan premium account",
  "code": "PREMIUM_REQUIRED"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan saat menghasilkan insight."
}
```


---

## 9. Admin API

All Admin API endpoints require the authenticated user to have the `admin` role. Regular users will receive a `403 Forbidden` response.

### 9.1 Get Admin Overview
- **Endpoint**: `GET /api/admin/overview`
- **Description**: Returns aggregated platform statistics for the admin dashboard, including user counts, premium status, quiz engagement, and age segment distribution.
- **Authentication**: Required (Admin only)

**Response (200 OK):**
```json
{
  "data": {
    "totalUsers": 1240,
    "premiumUsers": 312,
    "activeUsers": 980,
    "nonActiveUsers": 260,
    "totalQuestionsActive": 45,
    "newUsersThisMonth": 88,
    "quizLogCount": 5620,
    "segmentCounts": [
      { "segment": "10-14", "count": 18 },
      { "segment": "15-18", "count": 15 },
      { "segment": "19-24", "count": 12 }
    ]
  }
}
```

**Response (401 Unauthorized):**
```json
{ "error": "Unauthorized" }
```

**Response (403 Forbidden):**
```json
{ "error": "Forbidden" }
```

**Response (500 Internal Server Error):**
```json
{ "error": "Internal Server Error" }
```

### 9.2 Get All Quiz Questions
- **Endpoint**: `GET /api/admin/quiz`
- **Description**: Returns all BraveChoice quiz questions (active and inactive), ordered by creation date descending.
- **Authentication**: Required (Admin only)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "question-uuid",
      "scenario": "Temanmu diejek di grup kelas.",
      "category": "Bullying",
      "optionA": "Membela teman",
      "optionB": "Diam saja",
      "correctOption": "A",
      "explanationCorrect": "Membela teman adalah pilihan yang tepat.",
      "explanationIncorrect": "Diam memperkuat perilaku pelaku.",
      "ageSegment": "10-14",
      "isActive": true,
      "createdAt": "2026-04-01T00:00:00.000Z"
    }
  ]
}
```

**Response (401 Unauthorized):**
```json
{ "error": "Unauthorized" }
```

**Response (403 Forbidden):**
```json
{ "error": "Forbidden" }
```

**Response (500 Internal Server Error):**
```json
{ "error": "Internal Server Error" }
```

### 9.3 Get Users (Admin)
- **Endpoint**: `GET /api/admin/users`
- **Description**: Returns a paginated, filterable, and searchable list of all non-admin users.
- **Authentication**: Required (Admin only)
- **Query Parameters**:
  - `search` (Optional): Search by name or email (case-insensitive)
  - `filter` (Optional): `all` (default) | `premium` | `basic` | `nonaktif`
  - `page` (Optional): Page number, default `1`
  - `limit` (Optional): Items per page, default `10`. Set to `0` to return all.

**Response (200 OK):**
```json
{
  "data": {
    "users": [
      {
        "id": "user-uuid",
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "isPremium": false,
        "status": "Aktif",
        "createdAt": "2026-03-10T08:00:00.000Z",
        "birthYear": 2008,
        "gender": "Laki-laki",
        "profileFilled": true,
        "currentStreak": 7
      }
    ],
    "total": 1240,
    "page": 1,
    "limit": 10,
    "currentSearch": "",
    "currentFilter": "all"
  }
}
```

**Response (401 Unauthorized):**
```json
{ "error": "Unauthorized" }
```

**Response (403 Forbidden):**
```json
{ "error": "Forbidden" }
```

**Response (500 Internal Server Error):**
```json
{ "error": "Internal Server Error" }
```
