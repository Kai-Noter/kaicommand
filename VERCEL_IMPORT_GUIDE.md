# How to Import Your GitHub Repo into Vercel

Step-by-step: get KaiCommand from GitHub running on Vercel.

---

## Step 1: Go to Vercel and sign in with GitHub

1. Open your browser and go to **[vercel.com](https://vercel.com)**.
2. Click **"Sign Up"** or **"Log In"** (top right).
3. Choose **"Continue with GitHub"**.
4. If asked, authorize Vercel to access your GitHub account. Click **Authorize** or **Install**.

---

## Step 2: Add a new project (import from GitHub)

1. On the Vercel dashboard, click **"Add New..."** (or **"New Project"**).
2. You’ll see **"Import Git Repository"**.
3. Under **"Import Git Repository"**, you should see a list of your GitHub repos.  
   - If you don’t see them, click **"Adjust GitHub App Permissions"** and allow Vercel access to the repo (or all repos).
4. Find **"KaiCommand"** (or **jacklwinga-cyber/KaiCommand**) and click **"Import"** next to it.

---

## Step 3: Configure the project (before deploying)

On the **"Configure Project"** screen:

1. **Project Name**  
   - Leave as **KaiCommand** or change it if you like (e.g. `kai-command`). This will be part of the default URL: `kai-command.vercel.app`.

2. **Framework Preset**  
   - Should show **Next.js**. If not, choose **Next.js** from the dropdown.

3. **Root Directory**  
   - Leave as **`.`** (project root).

4. **Build and Output Settings**  
   - **Build Command:** leave default (`npm run build` or `next build`).  
   - **Output Directory:** leave default (e.g. `.next`).  
   - **Install Command:** leave default (`npm install` or `yarn install`).

5. **Environment Variables** (important)  
   - Click **"Environment Variables"** to expand it.  
   - Add these one by one (name + value):

   | Name             | Value (example)                          |
   |------------------|-------------------------------------------|
   | `NEXTAUTH_SECRET` | A long random string (e.g. run `openssl rand -base64 32` in terminal and paste) |
   | `NEXTAUTH_URL`    | `https://kai-command.vercel.app` (or whatever your project name is; you can change this after the first deploy to your real URL) |
   | `DATABASE_URL`    | For now you can leave this for a first deploy; for a real app you need a hosted DB (e.g. Vercel Postgres). See CUSTOM_DOMAIN_GUIDE.md. |

   - For each variable: type the **Name**, type the **Value**, then click **Add** (or **Add another**).  
   - Leave **Environment** as **Production** (or add to Preview too if you want).

6. Click **"Deploy"** at the bottom.

---

## Step 4: Wait for the build

1. Vercel will clone your repo and run `npm install` and `npm run build`.
2. You’ll see a log of the build. It can take 1–3 minutes.
3. If the build **succeeds**, you’ll see **"Congratulations!"** and a link like **https://kai-command-xxx.vercel.app**.
4. If the build **fails**, check the red error in the log. Common fixes:
   - **Missing env var:** Add the variable in **Project → Settings → Environment Variables** and redeploy.
   - **Prisma / DB error:** For a quick test you can leave `DATABASE_URL` as in `.env.example` only if you add it in Vercel; for production use a real hosted database.

---

## Step 5: Open your app

1. Click **"Visit"** or the URL (e.g. **https://kai-command-xxx.vercel.app**).
2. Your KaiCommand app should load.  
   - If you didn’t set a real `DATABASE_URL`, some features that need the DB may not work until you add a hosted database.

---

## After import: where to find things

- **Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard) — all your projects.
- **Your project:** Click **KaiCommand** → **Settings** for env vars, **Domains** for custom domain, **Deployments** for history and redeploys.
- **Redeploy:** **Deployments** → three dots on latest deployment → **Redeploy**.

---

## Quick checklist

- [ ] Sign in at vercel.com with GitHub  
- [ ] Add New → Import **KaiCommand** from GitHub  
- [ ] Framework: Next.js, Root: `.`  
- [ ] Add env vars: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (and `DATABASE_URL` when you have a hosted DB)  
- [ ] Click Deploy  
- [ ] Wait for build, then open the **Visit** link  

That’s the full import: GitHub repo → Vercel project → live URL.
