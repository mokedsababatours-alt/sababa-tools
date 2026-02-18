# 🚀 Travel Portal — Setup Guide

## What You're Building

Two portals, one app:
- `tools.yourdomain.com` — your team sees this
- `admin.yourdomain.com` — only you, with extra tools + user management

---

## Step 1: Prerequisites

You need:
- [Node.js 20+](https://nodejs.org) installed
- [Git](https://git-scm.com) installed
- A GitHub account (free)
- Cursor editor installed

---

## Step 2: Set Up the Project Locally

1. Open **Cursor** and open the `travel-portal` folder
2. Open the terminal inside Cursor (View → Terminal)
3. Run:
   ```bash
   npm install
   ```
4. Copy the env file:
   ```bash
   cp .env.example .env
   ```
5. Open `.env` and fill in your values:
   - Replace `yourdomain.com` with your real domain
   - Replace `REPLACE_WITH_LONG_RANDOM_STRING` — you can generate one by running:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - Set your admin email, name, and a strong password

6. Set up the database:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   You should see: `✅ Admin user created` and tool entries

7. Start the development server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — you should see the login page!

---

## Step 3: Push to GitHub

1. Create a new **private** repository on GitHub
2. In Cursor terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial portal setup"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

---

## Step 4: Deploy on Coolify

### Create the application

1. Log into Coolify
2. Click **+ New Resource → Application**
3. Select your GitHub repo
4. Build pack: **Dockerfile** (Coolify should auto-detect)
5. Set the **port** to `3000`
6. (Optional) In **Health Check** settings, set path to `/api/health` — the Dockerfile includes a built-in health check, but you can override via Coolify’s UI if needed

### Add your domains

In the application settings → Domains, add BOTH:
- `tools.yourdomain.com`
- `admin.yourdomain.com`

Coolify handles SSL for both automatically. ✅

### Add environment variables

In the application settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `file:/app/data/portal.db` (absolute path; both `file:/path` and `file:///path` work) |
| `NEXTAUTH_URL` | `https://tools.yourdomain.com` |
| `AUTH_SECRET` | (your generated random string) |
| `PORTAL_DOMAIN` | `tools.yourdomain.com` |
| `ADMIN_DOMAIN` | `admin.yourdomain.com` |
| `N8N_WEBHOOK_MARKETING` | `https://your-n8n.yourdomain.com/webhook/marketing-assistant` |
| `N8N_WEBHOOK_CUSTOMER` | `https://your-n8n.yourdomain.com/webhook/customer-reply` |
| `ADMIN_EMAIL` | `you@yourdomain.com` |
| `ADMIN_PASSWORD` | (your strong password) |
| `ADMIN_NAME` | `מנהל` |

### Add persistent storage (CRITICAL!)

Without this, your users and data will be wiped every deployment.

In the application settings → **Persistent Storage / Volumes**:
- Host path: `/data/travel-portal` (Coolify creates this)
- Container path: `/app/data`

### Deploy!

Click **Deploy**. Watch the build logs.

On first deploy, the app automatically:
1. Runs database migrations
2. Is ready to accept your seed data

Then run the seed **once** via Coolify's terminal or SSH:
```bash
# In the container terminal (Coolify has a terminal tab)
DATABASE_URL=file:/app/data/portal.db node scripts/seed.js
```

---

## Step 5: Configure n8n for Embedding

If you want n8n to appear embedded inside the portal (not just linked), add this
environment variable to your **n8n** application in Coolify:

```
N8N_BLOCK_ENV_ACCESS_IN_NODE=false
GENERIC_TIMEZONE=Asia/Jerusalem
N8N_EDITORS_MANAGEMENT_DISABLED=false
# This is the one that allows the iframe:
N8N_SECURE_COOKIE=false
```

And in n8n's settings, under "Security" → allow iframe embedding from your domain.

---

## Step 6: Add/Edit Tools

### To add a new chat tool:
1. Add a new webhook URL to `.env`:
   ```
   N8N_WEBHOOK_MY_TOOL="https://your-n8n.yourdomain.com/webhook/my-tool"
   ```
2. Add the env var in Coolify too
3. In Cursor terminal (or Coolify terminal):
   ```bash
   # Connect to database and add a tool row
   npm run db:studio
   ```
   This opens a visual database editor at http://localhost:5555
   Add a row to the `Tool` table with:
   - `type`: `chat`
   - `webhookEnv`: `N8N_WEBHOOK_MY_TOOL`
   - `portal`: `both` or `admin`

### To add a new link/embed tool:
Same as above but:
- `type`: `link` or `embed`
- `url`: the full URL of the service

---

## Common Issues

**Login doesn't work after deploy**
→ Check that `NEXTAUTH_URL` exactly matches your domain (with https://)
→ Check that `AUTH_SECRET` is set

**Data disappears after redeploy**
→ You forgot the persistent volume. Add it and redeploy.

**n8n won't embed**
→ Add the n8n env vars from Step 5

**Chat tool shows "webhook not configured"**
→ The env var name in `webhookEnv` column must exactly match the key in `.env`

---

## Adding Team Members

Go to `admin.yourdomain.com` → the admin panel includes a Users section.
Enter their name, email, and a temporary password. They log in at `tools.yourdomain.com`.
