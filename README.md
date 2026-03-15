# KaiCommand

**Your AI Command Center: secretary, servant, and reliable friend.**

KaiCommand helps you manage apps, emails, tasks, finances, and a password vault; switch work context (healthcare, electrical, development); and use the Play Centre for focus, breathing, and brain breaks. The built-in AI doesn’t just say yes—it gives well-reasoned answers and can argue the other side when that’s useful.

---

## Features

- **Dashboard** – At-a-glance stats, “While you were away” digest, and suggested actions
- **Work context** – Switch between healthcare, electrical, and development modes
- **App manager** – Monitor app status and get AI suggestions
- **Email hub** – View and manage emails (mock data; connect a real provider for live inbox)
- **Tasks** – Scheduled tasks with categories and run history
- **Finance** – Transactions, balance, and budget overview (currency: £)
- **Password vault** – Encrypted, persisted passwords (add / edit / delete)
- **Play Centre** – Memory game, reaction game, focus timer, breathing, meditation
- **AI assistant** – Chat with ⌘K; “argue the other side” and context-aware actions (navigate, switch context, start focus/breathing)
- **Command palette** – ⌘⇧K to jump to any section
- **Audit log** – Recent activity from real actions (context switch, task created, password added)

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/jackwinga-cyber/KaiCommand.git
cd KaiCommand
npm install
```

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- **NEXTAUTH_SECRET** – Any long random string (e.g. `my-super-secret-key-12345`)
- **DATABASE_URL** – Default `file:./dev.db` is fine for local dev  
Optional: **AUTH_DEMO_PASSWORD** for email/password login.

### 3. Database

```bash
npm run db:generate
npm run db:push
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Shortcuts:**

- **⌘K** (Mac) / **Ctrl+K** (Windows) – AI assistant  
- **⌘⇧K** / **Ctrl+Shift+K** – Command palette

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4**, **shadcn/ui**, **Framer Motion**, **Recharts**
- **Prisma** (SQLite for local dev), **NextAuth.js** (JWT + Credentials)
- **TanStack Query** (data hooks), **Z.ai SDK** (AI chat)

---

## Project docs

| Doc | Purpose |
|-----|--------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Data flow, auth, security, extending the app |
| [LOCAL_SETUP_GUIDE.md](./LOCAL_SETUP_GUIDE.md) | Step-by-step local setup (beginner-friendly) |
| [GITHUB_SETUP.md](./GITHUB_SETUP.md) | Push to GitHub and deploy |
| [GITHUB_TOPICS_GUIDE.md](./GITHUB_TOPICS_GUIDE.md) | Add repo topics on GitHub |
| [PERFORMANCE_AND_FEATURES.md](./PERFORMANCE_AND_FEATURES.md) | What to trim for a smoother, faster app |
| [EXTRA_SUGGESTIONS_AND_IDEAS.md](./EXTRA_SUGGESTIONS_AND_IDEAS.md) | More ideas (automation, devil’s advocate, etc.) |

---

## License

Private repository. All rights reserved.
