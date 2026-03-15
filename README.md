# KaiCommand

**Your AI Command Center: secretary, servant, and reliable friend.**

KaiCommand is a single dashboard for apps, emails, tasks, finance, and a password vault—with work contexts (healthcare, electrical, development) and a Play Centre for focus and wellness. The built-in AI doesn’t just say yes: it gives reasoned answers and can **argue the other side** when that helps you decide.

---

## Why KaiCommand?

- **One place** – Dashboard, tasks, finance, vault, and AI in a single app  
- **Context-aware** – Switch between work modes; the AI and UI adapt  
- **Honest AI** – Secretary and devil’s advocate, not a yes-bot  
- **“While you were away”** – Digest and suggested actions when you open the app  

---

## Features

| Area | What you get |
|------|----------------|
| **Dashboard** | Stats, “While you were away” digest, suggested actions |
| **Work context** | Healthcare, electrical, development – switch and filter by mode |
| **App manager** | Monitor app status, AI suggestions |
| **Email hub** | View and manage emails (mock data; connect a real provider for live inbox) |
| **Tasks** | Scheduled tasks with categories and run history |
| **Finance** | Transactions, balance, budget (currency: £) |
| **Password vault** | Encrypted, persisted passwords (add / edit / delete) |
| **Play Centre** | Memory game, reaction game, focus timer, breathing, meditation |
| **AI assistant** | Chat (⌘K), “argue the other side”, navigate, switch context, start focus/breathing |
| **Command palette** | ⌘⇧K – jump to any section |
| **Audit log** | Recent activity from real actions (context switch, task created, password added) |

---

## Quick start

**1. Clone and install**

```bash
git clone https://github.com/jacklwinga-cyber/KaiCommand.git
cd KaiCommand
npm install
```

**2. Environment**

```bash
cp .env.example .env
```

Edit `.env`:

- **NEXTAUTH_SECRET** – Any long random string (e.g. `my-super-secret-key-12345`)
- **DATABASE_URL** – `file:./dev.db` is fine for local dev  
- **AUTH_DEMO_PASSWORD** – (optional) For email/password login

**3. Database**

```bash
npm run db:generate
npm run db:push
```

**4. Run**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **⌘K** / **Ctrl+K** | Open AI assistant |
| **⌘⇧K** / **Ctrl+Shift+K** | Open command palette (jump to section) |

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4**, **shadcn/ui**, **Framer Motion**, **Recharts**
- **Prisma** (SQLite local; use Postgres/MySQL for production), **NextAuth.js** (JWT + Credentials)
- **TanStack Query**, **Z.ai SDK** (AI chat)

---

## Docs

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
