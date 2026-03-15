# KaiCommand – Architecture

## Overview

KaiCommand is an AI Command Center: a single-page dashboard that combines productivity (apps, email, tasks, finance), professional context (healthcare, electrical, development), wellness (Play Centre), and an AI assistant that can navigate the app and act as secretary, servant, and reliable friend (including devil’s advocate when useful).

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion, Recharts
- **State:** TanStack Query for server state (see `src/hooks/use-api.ts`); local React state for UI
- **Backend:** Next.js API routes, Prisma (SQLite by default), Z.ai SDK for AI
- **Auth:** NextAuth (JWT + Credentials). Optional: unauthenticated demo user when `REQUIRE_AUTH` is not set

## Key Directories

- `src/app/` – App Router: `page.tsx` (main dashboard), `layout.tsx`, `api/*` routes
- `src/components/` – UI: `ui/` (shadcn), `providers.tsx` (Query + Session), `command-palette.tsx`
- `src/hooks/` – `use-api.ts` (TanStack Query hooks for all APIs), `use-toast.ts`, `use-mobile.ts`
- `src/lib/` – `db.ts` (Prisma), `auth.ts` (NextAuth config), `api-auth.ts` (getUserId for routes), `theme-context.tsx`, `encryption.ts` (vault), `query-client.ts`
- `prisma/` – `schema.prisma` (User, App, Task, Email, Transaction, ChatMessage, WorkContext, VoiceNote, InventoryItem, Certification, EmergencyProtocol, CodeSnippet, EnergyLog, Shift, ClientLog, PasswordEntry, AuditLog)

## Data Flow

1. **Auth:** NextAuth issues a JWT. `getUserId(request)` in `lib/api-auth.ts` reads the token and returns the user id, or (if `REQUIRE_AUTH` is not set) ensures the demo user exists and returns the demo user id.
2. **APIs:** All `/api/*` routes that need a user call `getUserId(request)` and use the returned id for Prisma queries (e.g. `where: { userId }`).
3. **Client:** Core data (apps, emails, tasks, finance) loads on mount. Work contexts load for the sidebar; professional data loads when the user opens a relevant tab; chat history when the AI modal opens; digest when the dashboard is active. Password vault uses TanStack Query and `/api/passwords`.
4. **AI:** `/api/chat` uses the Z.ai SDK, a system prompt that defines the secretary + devil’s advocate persona, and returns an optional `action` (e.g. `navigate`, `switchContext`, `emergency`, `startFocus`, `startBreathing`). The client handles these in `handleAiAction`.

## Security

- **Passwords:** Stored in `PasswordEntry` with `encryptedPassword` (AES-256-GCM). Key derived from `NEXTAUTH_SECRET` or `ENCRYPTION_KEY`. Never log or return decrypted passwords in API responses beyond the decrypted list for the authenticated user.
- **Auth:** Set `NEXTAUTH_SECRET` and optionally `REQUIRE_AUTH=true` in production. Use `AUTH_DEMO_PASSWORD` only for a simple credentials demo.

## Command Palette & Shortcuts

- **⌘K** (Mac) / **Ctrl+K** (Windows): Toggle AI assistant modal
- **⌘⇧K** / **Ctrl+Shift+K**: Open command palette (jump to Dashboard, Apps, Email, Finance, Play Centre, etc.)

## Extending

- **New API:** Add the route under `src/app/api/`, use `getUserId(request)` for user-scoped data, and add a corresponding hook in `src/hooks/use-api.ts` with `queryKey` and `queryFn`/`mutationFn`.
- **New section/tab:** Add the tab id and label to `navItems` in `page.tsx` and to `COMMANDS` in `command-palette.tsx`; render the section in the main content switch.
- **AI actions:** Extend the `action` object returned by `/api/chat` and handle it in `handleAiAction` in `page.tsx`.
