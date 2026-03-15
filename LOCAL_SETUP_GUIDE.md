# KaiCommand – Local setup guide (step by step)

Do these steps **in order**, one at a time. It’s like following a recipe.

---

## Step 1: Open the Terminal

- **Mac:** Press `Cmd + Space`, type **Terminal**, press Enter.
- **Windows:** Press `Win + R`, type `cmd`, press Enter.

You’ll see a window with a blinking cursor. That’s where you type the commands below.

---

## Step 2: Go to your project folder

Type this and press **Enter** (use your real path if it’s different):

```bash
cd "/Users/jacksonlwinga/Desktop/MPJL APPS/KaiCommand"
```

- **What it does:** “Go to the KaiCommand folder.”
- **What you’ll see:** The line might change to show that folder path. That’s good.

---

## Step 3: Copy the env file

Type this and press **Enter**:

```bash
cp .env.example .env
```

- **What it does:** Makes a copy of `.env.example` and calls it `.env`. Your app will read settings from `.env`.
- **What you’ll see:** Usually nothing (no error = it worked).

---

## Step 4: Put a secret in `.env`

You need to set **NEXTAUTH_SECRET**. It’s like a password the app uses to stay secure.

**Option A – Quick (any random sentence):**

1. Open the file `.env` in your editor (e.g. Cursor, Notepad).
2. Find the line:  
   `NEXTAUTH_SECRET="generate-a-long-random-string-here"`
3. Replace it with something long and random, for example:  
   `NEXTAUTH_SECRET="my-super-secret-key-12345-no-one-guess"`
4. Save the file.

**Option B – Strong secret (Terminal):**

1. In Terminal, run:  
   `openssl rand -base64 32`
2. Copy the line it prints (long mix of letters and numbers).
3. In `.env`, set:  
   `NEXTAUTH_SECRET="paste-that-line-here"`
4. Save the file.

**Optional – Demo login password:**

- If you want to log in with email + password later, in `.env` add (or uncomment):  
  `AUTH_DEMO_PASSWORD="your-secret-demo-password"`
- Replace `your-secret-demo-password` with a password only you know. Save.

---

## Step 5: Install tools (if you use Bun)

If you use **Bun** (not npm), run:

```bash
bun install
```

- **What it does:** Downloads all the code the app needs (like installing ingredients).
- **What you’ll see:** Lots of text; at the end it should say something like “Done” or show a list of packages. Wait until it finishes.

If you use **npm** instead, run:

```bash
npm install
```

---

## Step 6: Create the database (first time only)

Run these **two** commands, one after the other:

**Command 1:**

```bash
bun run db:generate
```

- **What it does:** Prepares the database “engine” for your app.
- **What you’ll see:** Something like “Generated Prisma Client”. Good.

**Command 2:**

```bash
bun run db:push
```

- **What it does:** Creates the tables (AuditLog, PasswordEntry, User, etc.) in your database file.
- **What you’ll see:** Something like “Your database is now in sync with your schema.” Good.

If you use **npm**, use:

```bash
npm run db:generate
npm run db:push
```

---

## Step 7: Start the app

Type:

```bash
bun run dev
```

(or `npm run dev` if you use npm)

- **What it does:** Starts the KaiCommand app on your computer.
- **What you’ll see:** Text like “Ready on http://localhost:3000” or “Local: http://localhost:3000”. Leave this window open.

---

## Step 8: Open the app in your browser

1. Open your web browser (Chrome, Safari, Edge, etc.).
2. In the address bar type:  
   **http://localhost:3000**  
   and press Enter.

You should see the KaiCommand dashboard.

**What you can try:**

- **Dashboard:** “While you were away” and “Suggested actions” may appear after you do some actions (e.g. add a task, switch context, add a password). At first they might be empty – that’s normal.
- **Password Vault:** Open that tab; add a password. It will be saved in the database (and encrypted).
- **Recent Activity:** Shows real actions from the audit log. If you haven’t done anything yet, it will say “No recent activity…”
- **AI (⌘K or Ctrl+K):** Opens the AI assistant. Chat history loads when you open it.
- **Play Centre:** Start a focus or breathing timer, then switch to another tab – the timer will stop when you leave the tab.

When you’re done, go back to the Terminal and press **Ctrl + C** to stop the app.

---

## If something goes wrong

| Problem | What to try |
|--------|-------------|
| “command not found: bun” | Use `npm` instead: `npm install`, `npm run db:generate`, `npm run db:push`, `npm run dev`. |
| “DATABASE_URL” or “NEXTAUTH_SECRET” error | Make sure you saved `.env` and that the line `NEXTAUTH_SECRET="..."` has a value inside the quotes. |
| “Cannot find module” or “prisma” error | Run `bun install` (or `npm install`) again, then `bun run db:generate` (or `npm run db:generate`). |
| Port 3000 already in use | Another app is using 3000. Close it or in `.env` you can set `PORT=3001` and use `http://localhost:3001`. |

---

## Optional: Make the app even faster

Open the file **PERFORMANCE_AND_FEATURES.md** in your project. It explains what you can turn off or simplify (e.g. lazy-load analytics, simplify the email hub) so the app runs more smoothly. You can do that later when you’re comfortable with the basics.

---

## Quick checklist

- [ ] Terminal open
- [ ] `cd` into project folder
- [ ] `cp .env.example .env`
- [ ] Set `NEXTAUTH_SECRET` in `.env` and save
- [ ] (Optional) Set `AUTH_DEMO_PASSWORD` in `.env`
- [ ] `bun install` or `npm install`
- [ ] `bun run db:generate` or `npm run db:generate`
- [ ] `bun run db:push` or `npm run db:push`
- [ ] `bun run dev` or `npm run dev`
- [ ] Open http://localhost:3000 in the browser

Done.
