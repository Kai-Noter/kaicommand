# Create a Hosted Database for Vercel

Your app needs a real database on the internet (not a file like `dev.db`). Here’s how to create one and connect it to KaiCommand.

---

## Option 1: Vercel Postgres (easiest – same dashboard)

### Step 1: Open the Vercel dashboard
- Go to **[vercel.com](https://vercel.com)** and sign in.
- You stay in the same place you use for deployments.

### Step 2: Go to Storage
- On the **left sidebar**, click **“Storage”** (or find it under your team menu).
- If you don’t see it, click your **team name** (e.g. “jacklwinga-3258’s projects”) and look for **Storage** in the menu.

### Step 3: Create a database
- Click **“Create Database”** (or **“Add”** → **Database**).
- Choose **“Postgres”** (Vercel Postgres).
- Give it a name, e.g. **kaicommand-db**.
- Choose a **region** (pick one close to you or your users).
- Click **Create** (or **Continue**).

### Step 4: Connect it to your project
- After the database is created, Vercel will show **“Connect to Project”**.
- Select your **KaiCommand** (or kaicommand) project.
- Vercel will add the **environment variables** for you (e.g. `POSTGRES_URL` or `DATABASE_URL`). Click **Connect** or **Save**.

### Step 5: Copy the connection URL (if you need to add it yourself)
- If you don’t connect to a project, go to the database page and open the **“.env.local”** or **“Quickstart”** tab.
- Copy the line that looks like:  
  `POSTGRES_URL="postgres://..."`  
  or  
  `DATABASE_URL="postgres://..."`
- In your **project** on Vercel → **Settings** → **Environment Variables**, add:
  - **Name:** `DATABASE_URL`
  - **Value:** paste that `postgres://...` URL.

### Step 6: Update your app to use Postgres
Your app currently uses SQLite. You need to switch the schema to Postgres and redeploy. See “Update Prisma for Postgres” below.

---

## Option 2: Turso (free, works well with Vercel)

1. Go to **[turso.tech](https://turso.tech)** and sign up (free).
2. Create a new database (e.g. **kaicommand**), choose a region.
3. In the Turso dashboard, open your database and get the **connection URL** (looks like `libsql://...`) and an **auth token**.
4. On Vercel → your project → **Settings** → **Environment Variables**, add:
   - `DATABASE_URL` = the Turso URL (often needs `?authToken=...` or a separate `TURSO_AUTH_TOKEN` – check Turso docs).
5. In your project you’ll need to use the Turso client or a Prisma adapter for LibSQL; this is a bit more setup than Postgres.

---

## Update Prisma for Postgres (if you use Vercel Postgres)

1. Open your project in Cursor and edit **`prisma/schema.prisma`**.
2. Find the line that says:
   ```prisma
   provider = "sqlite"
   url      = env("DATABASE_URL")
   ```
3. Change it to:
   ```prisma
   provider = "postgresql"
   url      = env("DATABASE_URL")
   ```
   (If Vercel gave you `POSTGRES_URL` instead of `DATABASE_URL`, either add an env var `DATABASE_URL` with the same value as `POSTGRES_URL`, or use `env("POSTGRES_URL")` in the schema.)
4. In Terminal, run:
   ```bash
   cd "/Users/jacksonlwinga/Desktop/MPJL APPS/KaiCommand"
   npx prisma migrate dev --name switch_to_postgres
   ```
   (If you get errors, you may need to run `npx prisma generate` and then push: `npx prisma db push` for a new DB.)
5. Commit the changes (including the new migration in `prisma/migrations/`) and push to GitHub. Then on Vercel, click **Redeploy**.

---

## Quick checklist (Vercel Postgres)

- [ ] Vercel dashboard → **Storage** → **Create Database** → **Postgres**
- [ ] Name it (e.g. kaicommand-db), create it
- [ ] **Connect to Project** → select KaiCommand (or add `DATABASE_URL` / `POSTGRES_URL` in Environment Variables)
- [ ] In your code: `prisma/schema.prisma` → `provider = "postgresql"`, `url = env("DATABASE_URL")` (or `POSTGRES_URL`)
- [ ] Run `npx prisma migrate dev` or `npx prisma db push`, then commit and push
- [ ] Vercel → **Redeploy**

After that, your hosted database is created and your app uses it on Vercel.
