# Performance & Features: What to Keep, Trim, or Remove

This document advises which features to **remove or simplify** so KaiCommand runs smoothly and performs its core tasks (secretary, servant, reliable friend) efficiently.

---

## 1. **Features to consider removing or simplifying**

### 1.1 Static / mock “Recent Activity” (low value)

- **What:** The dashboard shows a “Recent Activity” list. When no audit log exists, it falls back to **static mock entries** (e.g. “App health check completed”, “New email received”).
- **Advice:** **Remove the static fallback** and show only real audit data. If there are no recent audit entries, show a single line: “No recent activity. Switch context, add a task, or use the vault to see actions here.” This reduces noise and keeps the UI truthful.
- **Where:** In `page.tsx`, the `recentActivity` array is the static fallback; the digest already provides `recentActivity` from the API when available.

### 1.2 Analytics / charts on initial load

- **What:** The main fetch loads **analysis/analytics** (metrics, trends, category data) on every mount even if the user never opens an analytics view.
- **Advice:** **Lazy-load analytics** the same way professional data is lazy-loaded: only fetch `/api/analysis` when the user opens a tab or section that shows charts (if you have one). If no tab uses it yet, remove it from the initial fetch to speed up first load.
- **Where:** In the `useEffect` that runs on mount, drop `fetch('/api/analysis')` and call it only when a relevant tab is active (or remove it if unused).

### 1.3 Play Centre games when tab not visible

- **What:** Memory game, reaction game, focus timer, breathing, and meditation all live under the Play Centre tab. Timers and animations can keep running when the tab is not visible.
- **Advice:** **Pause or reset timers when the tab is not active.** For example, when `activeTab !== 'playcentre'`, set `focusActive`, `breathingActive`, `meditationActive` to false (or pause them). This avoids background timers and unnecessary re-renders.
- **Where:** In `page.tsx`, add an effect that clears or pauses these states when `activeTab` changes away from `playcentre`.

### 1.4 Chat history on mount

- **What:** Chat history is fetched on every mount so the AI modal can show previous messages.
- **Advice:** **Lazy-load chat history** when the user opens the AI modal (⌘K) instead of on mount. That saves one request and a bit of work on first load.
- **Where:** Remove `fetch('/api/chat')` from the initial `useEffect`; fetch chat when `aiModalOpen` becomes true (or use a `useChatHistory()` hook with `enabled: aiModalOpen`).

### 1.5 Multiple simultaneous fetches on mount

- **What:** On mount you still fetch apps, emails, tasks, finance, analysis, and chat in parallel. That’s 6 requests before the user does anything.
- **Advice:** **Minimum for “smooth” first load:** Fetch only what the **dashboard** needs: e.g. apps (for count/status), emails (for unread count), tasks (for active count), finance (for balance). Drop analysis and chat from the first batch; load them when the user opens the relevant tab or the AI modal (see above). Digest is already loaded only when the dashboard tab is active.

---

## 2. **Features to keep (core value)**

- **Dashboard stats** (active tasks, apps, unread emails, balance) – core at-a-glance value.
- **Digest + suggestions** – “While you were away” and “Suggested actions” support the secretary role.
- **Work contexts** – needed for the sidebar and context-aware behaviour; keep the lightweight contexts fetch on mount.
- **Password Vault** – persisted and encrypted; load only when the user opens the tab (already via `usePasswords()` when that tab is used).
- **AI assistant + “Argue the other side”** – core to the reliable friend / devil’s advocate role; load chat when the modal opens.
- **Audit log** – light and only written on key actions; keep it for trust and digest.
- **Command palette (⌘⇧K)** – low cost, high efficiency; keep.

---

## 3. **Quick wins checklist**

| Action | Effect |
|--------|--------|
| Remove static `recentActivity` fallback; show only real audit data | Less noise, truthful UI |
| Lazy-load `/api/analysis` (or remove if no chart tab) | Fewer requests on mount |
| Lazy-load chat history when AI modal opens | Faster first load |
| Pause Play Centre timers when tab is not active | Fewer background updates, better battery/CPU |
| Restrict initial fetch to dashboard-only data (apps, emails, tasks, finance) | Faster, smoother first load |

---

## 4. **Optional: further slimming**

- **Email hub:** If you don’t use real email integration, the Email tab is mock data. You could hide it or replace it with a “Connect your inbox” CTA to avoid maintaining unused UI.
- **Finance charts:** If the finance view uses heavy charts (e.g. many recharts), consider simplifying to a table + summary or loading charts only when the user expands a section.
- **Theme/mood switcher:** Keep for UX; no real performance cost.
- **Sign-up modal / auth UI:** If you rely on a single demo user and don’t need sign-up, you can hide or remove the sign-up flow to simplify the surface area.

---

## 5. **Summary**

- **Remove or trim:** Static recent activity fallback, analysis fetch on mount, chat fetch on mount, and any unnecessary work when Play Centre tab is not visible.
- **Keep:** Dashboard stats, digest, suggestions, work contexts, vault, AI (with chat loaded on modal open), audit log, command palette.
- **Result:** Fewer requests on first load, less work when the user isn’t using a feature, and a focus on the secretary / servant / reliable friend tasks so the app runs smoothly and performs efficiently.
