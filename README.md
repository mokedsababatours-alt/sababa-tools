#  Sababa Tools — Travel Agency Internal Portal
## Project Knowledge Document

---

## What This Is

A self-hosted internal tools portal for the travel agency team.  
One URL, one login, all tools in one place.

**Live URL:** `tools.yourdomain.com`  
**Stack:** Next.js 16 · NextAuth v5 · better-sqlite3 · SQLite · Tailwind CSS  
**Hosted on:** Coolify (VPS) · Traefik reverse proxy · Docker container

---

## The Big Picture

```
Internet
   │
   ├── tools.yourdomain.com      → This portal (team + admin entry point)
   ├── automation.yourdomain.com → n8n (webhooks + automation, stays separate)
   └── wa.yourdomain.com         → WhatsApp interface (stays separate)

Inside the portal:
   ├── Team members see:  shared tools (chat assistants, embeds, links)
   └── Admin (you) sees:  everything + user management + admin-only tools
```

The portal does **not replace** n8n or WhatsApp — it wraps them.  
Those services keep their own subdomains for external API/webhook access.  
Inside the portal, they appear as embedded iframes or linked tiles.

---

## Authentication

- **Single login system** — one account works everywhere
- **No self-signup** — you add users manually via the admin panel
- **Two roles:**
  - `user` — sees shared tools only
  - `admin` — sees everything, can manage users
- **Sessions** are JWT-based, stored in browser cookies
- Inactive users are blocked at login (you can toggle this per user)

---

## Tool Types

Every tile on the portal grid is a **Tool** — a row in the database.  
Each tool has a `type` field that controls its behavior:

| Type | What it does | Config needed |
|------|-------------|---------------|
| `link` | Opens URL in new tab | `url` field |
| `embed` | Shows service in iframe inside portal | `url` field |
| `chat` | AI chat interface (input/output) | `webhookEnv` field |

### Chat Tools — How They Work

```
User types message
       ↓
Portal sends POST to /api/chat  (server-side, secure)
       ↓
Server reads webhookEnv → gets n8n webhook URL from .env
       ↓
Forwards message to n8n webhook
       ↓
n8n processes (calls AI, does logic, etc.)
       ↓
Returns { reply: "..." }
       ↓
Portal displays response in chat bubble UI
       ↓
Message + reply saved to SQLite (ChatSession / ChatMessage tables)
```

The webhook URL never touches the browser — it stays server-side.  
n8n can return `{ reply }`, `{ text }`, `{ output }`, or `{ message }` — all handled.  
Every message is persisted. Chat history survives page refresh and is organised by session.

---

## Portal vs Admin View

Both use the same URL (`tools.yourdomain.com`).  
The app checks your **role** after login and adjusts what you see:

```
role: "user"   → sees tools where portal = "team" or "both"
role: "admin"  → sees tools where portal = "admin" or "both"
               → also has access to /admin/users
```

Tool `portal` field options:
- `both` — everyone sees it
- `team` — team only
- `admin` — admin only

---

## Project File Structure

```
sababa-tools/
│
├── app/                          Next.js App Router pages
│   ├── page.tsx                  Main portal dashboard (tile grid)
│   ├── login/page.tsx            Login page
│   ├── tool/[slug]/page.tsx      Individual tool page (embed or chat)
│   ├── admin/users/page.tsx      User management page
│   └── api/
│       ├── auth/[...nextauth]/        NextAuth endpoint (do not touch)
│       ├── chat/route.ts              Proxies chat messages to n8n + persists history
│       ├── chat/sessions/route.ts     List / create chat sessions
│       ├── chat/sessions/[id]/
│       │   └── messages/route.ts      Fetch messages for a session
│       └── admin/
│           ├── tools/[id]/route.ts    Update / delete a tool (admin only)
│           ├── tools/reorder/route.ts Bulk reorder tools (admin only)
│           └── users/                 Add user / toggle active endpoints
│
├── components/
│   ├── tool-tile.tsx                  The big square button
│   ├── portal-grid.tsx                The grid layout of tiles
│   ├── portal-header.tsx              Top bar (title + logout)
│   ├── chat-tool.tsx                  Chat UI with session sidebar + history
│   ├── embed-tool.tsx                 iframe wrapper
│   ├── theme-toggle.tsx               Light/dark toggle (fixed bottom)
│   ├── theme-provider.tsx             Theme context + localStorage
│   └── admin/
│       ├── tools-panel.tsx            Tool management (add/edit/delete/reorder)
│       └── users-panel.tsx            Add/toggle users UI
│
├── lib/
│   ├── auth.ts                        NextAuth config + login logic
│   ├── db.ts                          better-sqlite3 database (singleton, auto-creates tables)
│   ├── chat.ts                        Chat session + message CRUD helpers
│   └── tools.ts                       Tool fetching helpers
│
├── scripts/
│   └── seed.js                        First-time setup: admin user + default tools
│
├── middleware.ts                 Auth guard — redirects if not logged in
├── next.config.js                Next.js config (standalone build, headers)
├── tailwind.config.js            Design tokens (cream/navy themes, colors)
├── Dockerfile                    Production container (used by Coolify)
├── .env.example                  Template for environment variables
└── SETUP.md                      Step-by-step deployment guide
```

---

## Database (SQLite)

Managed by **better-sqlite3** via `lib/db.ts`. Tables are created automatically on first server start — no migration step required.

**`User`**
| Field | Notes |
|-------|-------|
| id | Auto-generated |
| name | Display name (Hebrew fine) |
| email | Used to log in |
| password | Bcrypt hashed (never plain text) |
| role | `"user"` or `"admin"` |
| active | `false` = blocked from login |

**`Tool`**
| Field | Notes |
|-------|-------|
| slug | URL-safe ID e.g. `marketing-assistant` |
| labelHe | Hebrew label shown on tile |
| labelEn | English label |
| icon | Emoji |
| type | `link` / `embed` / `chat` |
| url | For link/embed tools |
| webhookEnv | Env var name for chat tools e.g. `N8N_WEBHOOK_MARKETING` |
| color | Tile accent: `gold` / `teal` / `coral` / `default` |
| portal | `both` / `team` / `admin` |
| sortOrder | Display order on grid (drag-and-drop in admin panel) |
| active | `false` = hidden from portal |

**`ChatSession`**
| Field | Notes |
|-------|-------|
| id | Auto-generated |
| toolId | Which chat tool this session belongs to |
| createdAt | ISO timestamp |

**`ChatMessage`**
| Field | Notes |
|-------|-------|
| id | Auto-generated |
| sessionId | Parent session |
| role | `"user"` or `"ai"` |
| content | Message text |
| createdAt | ISO timestamp |

**Database location in production:** `/app/data/portal.db`  
This lives in the Coolify persistent volume. Never delete the volume.

---

## Environment Variables

Set these in Coolify's environment panel (never in code):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | `file:/app/data/portal.db` in production (or omit — defaults to `./data/portal.db`) |
| `NEXTAUTH_URL` | Must match your exact domain with https:// |
| `AUTH_SECRET` | Long random string — sessions break without this |
| `ADMIN_EMAIL` | Used by seed script for first admin user |
| `ADMIN_PASSWORD` | Used by seed script (change after first login) |
| `ADMIN_NAME` | Display name for admin user |
| `N8N_WEBHOOK_XXX` | One per chat tool. Name must match `webhookEnv` in DB |

---

## Adding a New Tool

### New chat tool (calls n8n):
1. Add webhook URL to `.env` and Coolify env panel:
   ```
   N8N_WEBHOOK_MY_TOOL="https://automation.yourdomain.com/webhook/my-tool"
   ```
2. Log in as admin → go to the Admin panel → click "➕ הוסף כלי חדש" to expand the add form.
3. Fill in the fields:
   - `type`: `chat`
   - `webhookEnv`: `N8N_WEBHOOK_MY_TOOL`
   - `portal`: `both` or `admin`
4. Redeploy (or just restart — env vars require redeploy)

### New embed tool (iframe another service):
1. Admin panel → "➕ הוסף כלי חדש"
2. Fill in:
   - `type`: `embed`
   - `url`: internal URL e.g. `http://localhost:5678`
3. No redeploy needed — takes effect immediately

### New link tile (just opens a URL):
Same as embed but `type: "link"` — opens in new tab.

---

## Themes

Two themes, toggled by the pill button fixed at the bottom of the screen:

| Theme | Base color | Feel |
|-------|-----------|------|
| Light | Warm cream `#fdfaf5` | Clean, professional, warm |
| Dark | Soft navy `#0c1528` | Calm, focused, not harsh |

Preference is saved in the browser (localStorage) and respected on return visits.  
CSS variables control all colors — edit `app/globals.css` to adjust.

Accent colors used for tile borders and highlights:
- **Gold** `#c9973a` — main accent, buttons, focus states
- **Teal** `#2d8a7e` — secondary accent
- **Coral** `#c9503a` — warnings, destructive actions

---

## Deployment (Coolify)

**Application settings:**
- Build: Dockerfile
- Port: 3000
- Domain: `tools.yourdomain.com`

**Persistent volume (CRITICAL):**
- Host: `/data/sababa-tools`
- Container: `/app/data`

Without the volume, the database is wiped on every redeploy.

**On first deploy:**
The database and all tables are created automatically when the container starts.  
Then run the seed **once** via Coolify terminal:
```bash
DATABASE_URL=file:/app/data/portal.db node scripts/seed.js
```

**Every subsequent deploy:**
Tables are created with `IF NOT EXISTS` — existing data is always preserved via the volume.

---

## n8n Integration Notes

n8n lives at `automation.yourdomain.com` — separate container, untouched.

**For chat tools:** The portal calls n8n webhook URLs server-side.  
Set up a webhook trigger in n8n → connect to AI node → return `{ "reply": "..." }`.

**For embedding n8n UI in the portal:**  
Add this to n8n's environment variables in Coolify:
```
N8N_SECURE_COOKIE=false
```
Then set the tool `type` to `embed` and `url` to `http://n8n-container:5678`  
(use the internal Docker network hostname, not the public subdomain).

**For external webhooks (WhatsApp callbacks etc.):**  
These hit `automation.yourdomain.com` directly — portal is not involved at all.

---

## Common Tasks

**Add a team member:**
Go to `tools.yourdomain.com/admin/users` → fill in name, email, password → Add.

**Disable a user (e.g. someone leaves):**
Same page → click "השבת" next to their name. They're blocked immediately.

**Hide a tool temporarily:**
Admin panel → use the enable/disable toggle on the tool row.

**Delete a tool permanently:**
Admin panel → click "מחק" on the tool row → confirm the Hebrew dialog.

**Reorder tiles:**
Admin panel → drag the ⠿ handle on any tool row to a new position. Order is saved immediately.

**Change a tile's Hebrew label, icon, or other fields:**
Admin panel → expand the tool's accordion row → edit inline → save.

---

## Local Development

```bash
npm install              # install dependencies
cp .env.example .env     # copy and fill in your values
npm run db:seed          # create admin user + default tools (DB is auto-created on first run)
npm run dev              # start at http://localhost:3000
```

The SQLite database and all tables are created automatically when the server starts for the first time — no separate migration step needed.

---

## Admin Tool Management

The admin panel (`/admin`) includes a full tool management interface:

- **Add tool** — click "➕ הוסף כלי חדש" to expand the form (collapsed by default). All fields have Hebrew labels above the inputs.
- **Edit tool** — expand any tool's accordion row to edit its fields inline and save.
- **Delete tool** — click "מחק" on any row. A Hebrew confirmation dialog appears; confirm to permanently remove the tool and all its data.
- **Reorder tools** — drag any row by its ⠿ handle. New order is persisted to the database immediately via the reorder API.
- **Enable / disable** — toggle the active state per tool without deleting it.

---

## Chat History

Chat tools now persist all conversations:

- **Sessions** — each conversation is a session tied to a tool. Sessions are global (not per-user).
- **Session sidebar** — appears on the right side of the chat window (RTL-aware). Lists all previous sessions for the current tool with timestamps.
- **New session** — click "＋ שיחה חדשה" in the sidebar to start a fresh conversation. Previous sessions remain accessible.
- **History on load** — when you open a chat tool, the most recent session is automatically selected and its messages are loaded.
- **Real-time updates** — sending a message updates the UI immediately via React state. No page reload required.
- **Storage** — `ChatSession` and `ChatMessage` tables in the same SQLite file as everything else.

---

## Security Notes

- Webhook URLs are never sent to the browser — all n8n calls go through `/api/chat`
- Passwords are bcrypt-hashed (cost factor 12) — never stored plain
- All routes except `/login` require authentication (enforced in `middleware.ts`)
- Admin routes check role server-side — middleware alone is not sufficient
- The `AUTH_SECRET` signs all session tokens — keep it secret, never commit it
- SQLite file contains all user data — the Coolify volume should not be publicly accessible
