# Connect a GoDaddy Domain to KaiCommand on Vercel

Step-by-step to point your GoDaddy domain (e.g. **kaicommand.com** or **app.kaicommand.com**) to your Vercel deployment.

---

## 1. Add the domain in Vercel

1. Go to **[vercel.com](https://vercel.com)** → sign in → open your **KaiCommand** project.
2. Click **Settings** (top) → **Domains** (left).
3. Under **Add domain**, type your domain:
   - **Apex:** `kaicommand.com` (no www)
   - **Subdomain:** `app.kaicommand.com` or `kai.kaicommand.com`
4. Click **Add**.
5. Vercel will show **which DNS records** to create. Keep this page open; you’ll need the **Type**, **Name**, and **Value** for GoDaddy.

Typical values Vercel shows:
- **Apex (e.g. kaicommand.com):** an **A** record with value **76.76.21.21**.
- **www:** a **CNAME** with value **cname.vercel-dns.com**.
- **Subdomain (e.g. app):** a **CNAME** with value **cname.vercel-dns.com**.

---

## 2. Open DNS in GoDaddy

1. Go to **[godaddy.com](https://godaddy.com)** and sign in.
2. Click your **profile/account** (top right) → **My Products**.
3. Find your domain (e.g. **kaicommand.com**) and click it.
4. On the domain’s page, open **DNS** or **Manage DNS** (often under “Additional Settings” or a **DNS** tab).
5. You should see a list of **Records** (A, CNAME, etc.). You’ll add or edit records here.

---

## 3. Add the records in GoDaddy

Use the **exact Type, Name, and Value** that Vercel shows. Below are the usual cases.

### Option A – Apex domain (kaicommand.com, no subdomain)

1. Click **Add** (or **Add Record**).
2. **Type:** **A**
3. **Name:** `@` (or leave blank if GoDaddy uses “@” for apex).
4. **Value** (or “Points to”): **76.76.21.21**
5. **TTL:** 600 or 1 Hour (default is fine).
6. Save.

Optional – redirect **www** to Vercel:

1. **Add** another record.
2. **Type:** **CNAME**
3. **Name:** `www`
4. **Value:** `cname.vercel-dns.com`
5. Save.

### Option B – Subdomain only (e.g. app.kaicommand.com)

1. Click **Add** (or **Add Record**).
2. **Type:** **CNAME**
3. **Name:** `app` (or the subdomain you chose, e.g. `kai` for kai.kaicommand.com).
4. **Value:** `cname.vercel-dns.com`
5. Save.

---

## 4. Remove conflicting records (if any)

- If you already have an **A** or **CNAME** for the same **Name** (e.g. `@` or `www`), **edit** it to the values above or **delete** it so only the Vercel record remains.
- Don’t leave an old “Parked” or “Forwarding” A record for `@`; replace it with **76.76.21.21**.

---

## 5. Set NEXTAUTH_URL in Vercel

1. In Vercel → your project → **Settings** → **Environment Variables**.
2. Find **NEXTAUTH_URL**. Edit it (or add it) and set it to your custom domain, for example:
   - `https://kaicommand.com`
   - or `https://app.kaicommand.com`
3. Save. Then **Redeploy** the project (Deployments → … on latest deployment → **Redeploy**) so the app uses the new URL.

---

## 6. Wait and verify

- DNS can take **5–30 minutes** (sometimes up to 24–48 hours).
- In Vercel → **Settings** → **Domains**, your domain should change to **Verified** when DNS is correct.
- Open **https://yourdomain.com** in a browser; you should see KaiCommand with HTTPS (Vercel provides the certificate).

---

## Quick reference (GoDaddy)

| Goal              | Type  | Name | Value                 |
|-------------------|-------|------|------------------------|
| Apex (kaicommand.com) | A     | `@`  | `76.76.21.21`          |
| www               | CNAME | `www`| `cname.vercel-dns.com` |
| app.kaicommand.com| CNAME | `app`| `cname.vercel-dns.com` |

Always confirm the values on your **Vercel → Settings → Domains** page for your project; use those if they differ from this table.
