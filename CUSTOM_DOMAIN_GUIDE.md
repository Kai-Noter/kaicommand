# Link KaiCommand to a Custom Domain

This guide walks you through deploying KaiCommand and connecting it to your own domain (e.g. **kaicommand.com** or **app.yoursite.com**).

---

## Overview

1. **Deploy** the app (e.g. Vercel) so it has a live URL.
2. **Get a domain** (buy one or use one you already have).
3. **Connect** the domain to your deployment in Vercel and update DNS.

---

## Step 1: Deploy to Vercel (if you haven’t already)

1. Go to [vercel.com](https://vercel.com) and sign in (use “Continue with GitHub”).
2. Click **Add New…** → **Project**.
3. **Import** your GitHub repo: **jacklwinga-cyber/KaiCommand**.
4. **Configure:**
   - **Framework Preset:** Next.js (should be auto-detected).
   - **Root Directory:** leave as `.`
   - **Build Command:** `npm run build` (or leave default).
5. **Environment variables** (important – click “Environment Variables” and add):
   - `DATABASE_URL` – For Vercel you need a **hosted database** (SQLite won’t work on Vercel). Use e.g. [Vercel Postgres](https://vercel.com/storage/postgres), [PlanetScale](https://planetscale.com), or [Turso](https://turso.tech). They give you a connection string; put it here.
   - `NEXTAUTH_SECRET` – Long random string (e.g. run `openssl rand -base64 32` and paste).
   - `NEXTAUTH_URL` – **https://your-app.vercel.app** (use the URL Vercel gives you after the first deploy; you’ll change this to your custom domain later).
6. Click **Deploy**. Wait for the build to finish. You’ll get a URL like **https://kai-command-xxx.vercel.app**.

**Note:** If you use a new database (e.g. Postgres), you must update your Prisma schema to `provider = "postgresql"` and run migrations. See your hosting docs for the exact `DATABASE_URL` format.

---

## Step 2: Get a domain

**Option A – Buy a new domain**

- **Vercel:** In your project, go to **Settings → Domains** and use “Buy Domain” (Vercel sells domains and configures them automatically).
- **Registrars:** [Namecheap](https://namecheap.com), [Google Domains](https://domains.google), [Cloudflare](https://cloudflare.com/products/registrar/), [Porkbun](https://porkbun.com). Search for the name you want (e.g. **kaicommand.com**), buy it, and note where you manage DNS (usually “DNS settings” or “Manage DNS”).

**Option B – Use a domain you already have**

- Log in to where your domain is registered and open the **DNS** or **Domain management** section. You’ll add or edit records in the next step.

---

## Step 3: Add the domain in Vercel

1. In the Vercel dashboard, open your **KaiCommand** project.
2. Go to **Settings** → **Domains**.
3. In “Add domain”, type your domain, e.g.:
   - **kaicommand.com** (apex domain), or  
   - **app.kaicommand.com** (subdomain).
4. Click **Add**. Vercel will show you what to do next (usually DNS records).

---

## Step 4: Point your domain to Vercel (DNS)

Vercel will show you **which records to add** in your DNS panel. Do this where your domain is managed (registrar or Cloudflare, etc.).

**If you use an apex domain (e.g. kaicommand.com):**

- Add an **A** record:  
  - **Name/host:** `@` (or leave blank).  
  - **Value:** `76.76.21.21` (Vercel’s IP – confirm in Vercel’s Domains page).
- Optionally add **www** as a **CNAME**:  
  - **Name:** `www`  
  - **Value:** `cname.vercel-dns.com`

**If you use a subdomain (e.g. app.kaicommand.com):**

- Add a **CNAME** record:  
  - **Name:** `app` (or whatever subdomain you chose).  
  - **Value:** `cname.vercel-dns.com`

**If you use Vercel’s “Buy Domain”:**  
Vercel often configures DNS for you; you may only need to confirm.

Save the DNS changes. They can take from a few minutes up to 24–48 hours to spread (often 5–15 minutes).

---

## Step 5: Set NEXTAUTH_URL to your domain

1. In Vercel, go to your project → **Settings** → **Environment Variables**.
2. Edit **NEXTAUTH_URL** and set it to your custom domain, e.g.:
   - `https://kaicommand.com` or  
   - `https://app.kaicommand.com`
3. Save. Redeploy the project (Deployments → … on latest → Redeploy) so the new URL is used.

---

## Step 6: Check that it works

1. In Vercel **Settings → Domains**, your domain should show as **Verified** (and “Valid Configuration”) once DNS has propagated.
2. Open your domain in a browser (e.g. **https://kaicommand.com**). You should see KaiCommand; HTTPS is provided by Vercel automatically.

---

## Quick reference

| Step | Where | What to do |
|------|--------|------------|
| 1 | Vercel | Deploy project from GitHub, add env vars (incl. DB, NEXTAUTH_SECRET, NEXTAUTH_URL). |
| 2 | Registrar / Vercel | Get a domain (buy or use existing). |
| 3 | Vercel → Settings → Domains | Add your domain (e.g. kaicommand.com or app.kaicommand.com). |
| 4 | Registrar DNS | Add A record (apex) or CNAME (subdomain) as Vercel instructs. |
| 5 | Vercel → Environment Variables | Set NEXTAUTH_URL to https://your-domain.com and redeploy. |
| 6 | Browser | Open https://your-domain.com and confirm the app loads. |

---

## Troubleshooting

- **“Domain not verified”** – Wait for DNS to propagate (up to 24–48 hours). Double-check the A/CNAME values and that they’re saved.
- **“Invalid configuration”** – Ensure the record type (A vs CNAME) and host name (@ or www/app) match what Vercel shows.
- **App works on vercel.app but not on custom domain** – Confirm NEXTAUTH_URL is your custom domain and you’ve redeployed.
- **Database errors in production** – Use a hosted DB (Postgres/MySQL); SQLite is for local dev only. Update `prisma/schema.prisma` and run migrations for the production DB.

If you tell me your registrar (e.g. Namecheap, Cloudflare) and the exact domain (e.g. kaicommand.com vs app.kaicommand.com), I can give you the exact DNS entries to paste.
