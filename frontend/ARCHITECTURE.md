# CACULUS System Architecture & Boundary Map (Updated 2026)

This document serves as the primary technical specification and architectural blueprint for the **CACULUS TSA Examination & Assessment Platform**. It defines the system layout, client/server execution boundaries, dual Supabase/JSON persistence layers, HttpOnly cookie security model, and exam permission matrix.

---

## 1. Directory Structure Overview

The project is structured as a full-stack monorepo featuring a Next.js 16+ App Router web application alongside a standalone Node.js Express API service.

```
caculus/
├── backend/                  # Standalone Express.js API Server
│   ├── src/
│   │   └── index.ts          # Express server entry point & health endpoints
│   ├── package.json          # Backend dependencies (express, cors, dotenv)
│   └── tsconfig.json         # TypeScript configuration for backend
│
└── frontend/                 # Next.js 16+ App Router Web Application
    ├── app/                  # Next.js App Router (Pages, Layouts, API Routes)
    │   ├── admin/            # Administrative portal (Exams, Students, Auto-publish, Editor)
    │   ├── dashboard/        # Student portal (Assigned exams, Accordion list, History, Score Gauge)
    │   ├── api/              # Server-side Route Handlers (/api/auth, /api/admin, /api/student)
    │   │   ├── admin/        # Admin routes (/exams, /exams/[id]/toggle, /students, /parse-pdf)
    │   │   ├── auth/         # Session management (/login, /logout, /me)
    │   │   └── student/      # Examination & AI solution routes (/exams, /explain, /submit)
    │   ├── layout.tsx        # Root UI layout & Be Vietnam Pro font configurations
    │   ├── globals.css       # Design tokens, Crimson theme (#d90429), micro-animations
    │   └── page.tsx          # Landing / portal redirection root
    │
    ├── components/           # React UI Components (Client & Server Components)
    │   ├── layout/
    │   │   └── Navbar.tsx    # Seamless Crimson Red topbar (#d90429) & high-contrast profile
    │   ├── AntiCheatMonitor.tsx
    │   └── QuestionCard.tsx
    │
    ├── data/                 # Local persistent storage directory
    │   └── db.json           # JSON-file based database storage (fs fallback)
    │
    ├── lib/                  # Server-side business logic & storage adapters (@/lib)
    │   ├── supabase.ts       # Supabase Cloud Database Client & configuration check
    │   ├── db.ts             # File system data provider & Supabase sync wrapper
    │   ├── auth.ts           # JWT authentication & bcrypt password hashing
    │   └── mockData.ts       # Initial seed data for users, exams, & questions
    │
    ├── types/                # TypeScript domain models
    │   └── index.ts          # Schemas for User, Exam (isPublished), Question, Submission
    │
    ├── package.json          # Dependencies (@supabase/supabase-js, next, react, etc.)
    └── tsconfig.json         # Path alias definitions (@/* maps to ./*)
```

---

## 2. Supabase Cloud & Dual Persistence Architecture

CACULUS uses a hybrid, zero-downtime dual-persistence strategy:

```mermaid
flowchart TD
    Client[Client Browser Request] --> API[Next.js API Route Handler]
    API --> Check{Is Supabase Configured?}
    Check -- Yes --> SupabaseDB[(Supabase Cloud DB<br/>'students' & 'exams' tables)]
    Check -- Backup / Local --> LocalDB[(Local File Storage<br/>data/db.json via fs)]
    SupabaseDB --> Cache[revalidatePath('/dashboard', '/admin')]
    LocalDB --> Cache
    Cache --> Response[NextResponse JSON + HttpOnly Cookie]
```

### Table Schemas (Supabase & JSON DB)
* **`students` / `users`**: `id`, `email`, `password_hash`, `name`, `student_id`, `role`, `is_vip`, `created_at`
* **`exams`**: `id`, `title`, `description`, `is_free`, `is_published`, `status`, `modules`, `created_at`
* **`submissions`**: `id`, `userId`, `examId`, `score`, `sectionScores`, `answers`, `completedAt`

---

## 3. HttpOnly Cookie Authentication & Security Model

Authentication uses secure **HttpOnly Cookies** to prevent XSS session hijackings and eliminate autofill issues:

1. **Login Request (`POST /api/auth/login`)**:
   - Accepts credentials without pre-filled state (`autoComplete="new-password"`).
   - Queries Supabase `students` table (or local DB).
   - Validates bcrypt hash.
   - Signs JWT payload (`userId`, `email`, `role`, `name`, `studentId`, `isVip`).
   - Returns HttpOnly cookies: `caculus_token` & `caculus_session` (`SameSite=Lax`, `Path=/`, `Max-Age=7 days`).

2. **Logout Request (`POST /api/auth/logout`)**:
   - Deletes `caculus_token` and `caculus_session` cookies.
   - Clears client `localStorage`.

3. **Session Verification (`GET /api/auth/me`)**:
   - Extracts and verifies HttpOnly cookie payload on the server.

---

## 4. Strict Exam Permission Matrix

Exam access in `app/dashboard/page.tsx` is governed by a strict Boolean formula:

$$\text{canAccess} = \text{isPublished} \land (\text{isDemoExam} \lor \text{isUserVip} \lor \text{isAdmin})$$

| `isPublished` | `isDemoExam` / `isUserVip` | User Role | Button State | Text Display |
| :--- | :--- | :--- | :--- | :--- |
| `false` / `CHƯA UPDATE` | Any | Any | **Disabled (Gray)** | 🔒 Đề chưa mở |
| `true` | `false` (VIP Exam) | Student (Non-VIP) | **Disabled (Gray)** | 🔒 Cần tài khoản VIP |
| `true` | `true` (DEMO Exam) | Student / Guest | **Enabled (Crimson)** | Vào thi / Làm bài |
| `true` | Any | VIP / Admin | **Enabled (Crimson)** | Vào thi / Làm bài |

### Dedicated Independent Toggle API
- Endpoint: `PATCH /api/admin/exams/[id]/toggle`
- Action: Toggles `is_published` in Supabase & `db.json`, then triggers `revalidatePath('/dashboard')` and `revalidatePath('/admin/exams')`.

---

## 5. Client vs. Server Execution Boundaries

To prevent bundling crashes (`Module not found: Can't resolve 'fs'`), strictly observe execution boundaries:

| Boundary Rule | Server Environment (`Node.js`) | Client Environment (`Browser Runtime`) |
| :--- | :--- | :--- |
| **Directives** | Route Handlers (`app/api/**`), `@/lib/db`, `@/lib/supabase` | Components marked with `'use client'` |
| **File System (`fs`)** | Allowed (`fs.readFileSync`, `fs.writeFileSync`) | **FORBIDDEN** |
| **Supabase Access** | Full Read/Write via `@/lib/supabase` | Read via API routes |
| **UI Components** | Server Components | Client Components with interactive state |

---

## 6. Verification & Build Integrity

* **Production Build Command**: `npm run build`
* **Route Coverage**: 25/25 Static & Dynamic routes prerendered cleanly.
