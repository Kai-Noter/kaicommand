# Deploy KaiCommand on GitHub

Follow these steps to put your project on GitHub and (optionally) deploy it.

---

## 1. Prepare the repo locally

### 1.1 Initialize Git (if not already)

```bash
cd "/Users/jacksonlwinga/Desktop/MPJL APPS/KaiCommand"

# Check if git is already initialized
git status
# If you see "not a git repository", run:
git init
```

### 1.2 Add Prisma and env placeholder (optional)

Ensure the database file and env are not committed (they’re in `.gitignore`). Keep a copy of `.env.example` so others know which variables to set:

```bash
# .env is ignored; .env.example is committed
git add .env.example
```

### 1.3 Stage and commit everything

```bash
git add .
git status   # Review what will be committed
git commit -m "Initial commit: KaiCommand AI Command Center"
```

---

## 2. Create the repo on GitHub

### 2.1 Create a new repository

1. Go to [github.com](https://github.com) and sign in.
2. Click **+** (top right) → **New repository**.
3. **Repository name:** e.g. `KaiCommand` (or `kaicommand`).
4. **Description:** e.g. `AI Command Center – secretary, servant, reliable friend`.
5. Choose **Public** (or Private).
6. **Do not** check “Add a README” or “Add .gitignore” (you already have them).
7. Click **Create repository**.

### 2.2 Connect and push

GitHub will show “push an existing repository from the command line”. Run (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

If GitHub suggests **SSH** instead:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Example:

```bash
git remote add origin https://github.com/jacksonlwinga/KaiCommand.git
git branch -M main
git push -u origin main
```

---

## 3. Set secrets for deployment (no .env in repo)

Your `.env` is ignored, so you need to configure secrets where the app runs.

### If you deploy on Vercel (recommended for Next.js)

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your GitHub repo.
2. In **Settings → Environment Variables** add:
   - `DATABASE_URL` – for production use a real database (e.g. [Vercel Postgres](https://vercel.com/storage/postgres), [PlanetScale](https://planetscale.com), or [Turso](https://turso.tech)). SQLite is not suitable for serverless; use Postgres or MySQL and update `prisma/schema.prisma` to the right `provider`.
   - `NEXTAUTH_SECRET` – long random string (e.g. `openssl rand -base64 32`).
   - `NEXTAUTH_URL` – your app URL (e.g. `https://your-app.vercel.app`).
   - Optional: `AUTH_DEMO_PASSWORD`, `REQUIRE_AUTH`, `ENCRYPTION_KEY`.
3. Redeploy after saving variables.

### If you deploy on Railway / Render / your own server

- Add the same variables in that platform’s “Environment” or “Secrets” UI.
- For SQLite on a single server you can set `DATABASE_URL="file:./prod.db"` and run `prisma migrate deploy` (or `db push`) in the build/start step.

---

## 4. Optional: GitHub Actions (CI)

The repo includes a workflow that runs on push/PR:

- **Lint:** `npm run lint`
- **Tests:** `npm run test`
- **Build:** `npm run build` (to catch build errors)

Location: `.github/workflows/ci.yml`. No extra setup needed; it runs when you push.

---

## 5. Optional: Deploy with Vercel (from GitHub)

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your GitHub repo (e.g. `YOUR_USERNAME/KaiCommand`).
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** leave as `.`
5. **Build Command:** `npm run build` or `bun run build`.
6. **Environment Variables:** add the ones from section 3.
7. **Deploy.**

Every push to `main` will trigger a new deployment.

---

## 6. Database in production

- **SQLite** is fine for local/dev; for Vercel or other serverless platforms you need a **hosted database** (Postgres or MySQL).
- Update `prisma/schema.prisma`:

  ```prisma
  datasource db {
    provider = "postgresql"   # or "mysql"
    url      = env("DATABASE_URL")
  }
  ```

- Then:

  ```bash
  npx prisma migrate dev --name init   # create migration
  # Commit the new migration in prisma/migrations/
  ```

- On the hosting platform, set `DATABASE_URL` and run:

  ```bash
  npx prisma migrate deploy
  ```

  (or add this to your build/deploy step.)

---

## Quick reference

| Step | Command / action |
|------|-------------------|
| Init | `git init` |
| First commit | `git add .` then `git commit -m "Initial commit"` |
| Create repo | GitHub → New repository (no README/.gitignore) |
| Connect | `git remote add origin https://github.com/USER/REPO.git` |
| Push | `git branch -M main` then `git push -u origin main` |
| Secrets | Set in Vercel/Railway/etc.: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL` |
| Deploy | Vercel: Import repo → add env vars → Deploy |

If you hit a specific error (e.g. push rejected, build fail, or env vars), share the message and we can fix it step by step.
