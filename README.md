# Jewel

**Your thinking isn't linear. Your notes shouldn't be either.**

Jewel is a spatial canvas for thinking. Every idea is a node. Every connection is a directed edge. Tap to create, drag to arrange, and let the shape of your canvas become the shape of your thought.

---


## What it looks like

| **Canvas** | **Settings Panel** |
| :--- | :--- |
| <a href="https://github.com/user-attachments/assets/c5046eaa-79ae-4908-bfd3-ebdb3cc95646"><img width="1220" height="878" alt="image" src="https://github.com/user-attachments/assets/54c93540-aba3-47e7-97a3-3406aaebf476" height="400" alt="Jewel Canvas" /></a> | <a href="https://github.com/user-attachments/assets/c4982120-78e5-496f-b044-c9759f483363"><img width="1198" height="927" alt="image" src="https://github.com/user-attachments/assets/b4871667-a498-4bca-bb68-069cb22ad601" height="400" alt="Settings Panel" /></a> |
| *Spatial canvas showing nodes, directed edges, and session colors.* | *Settings panel with font sizes, session color editor, and layout controls.* |





---

## Features

### The Canvas

Jewel's canvas is infinite, pannable, and zoomable. There's no hierarchy, no folders, no inbox — just a space where thoughts connect.

- **Tap empty space** to create a new node at that position
- **Auto-connect:** every new node automatically draws a directed edge from the nearest existing node
- **Long-press a node, then drag outward** to enter edge-draw mode — a dashed rubber-band line follows your cursor, and releasing on empty space creates a new node with an explicit edge from the source
- **Long-press + release on an existing node** to draw an edge between two existing nodes with no new node created
- **Drag any node** to reposition it; edges stretch live

### Node Editing

Click any node to open the edit popover. Type, voice-transcribe, or paste a URL.

- **Save:** `Enter` or click away
- **Discard:** `Escape` (removes node if it was just created and is still empty)
- **Delete node:** Delete button inside the popover (immediate, no second confirmation)
- **Voice input:** click the mic button, speak, release — transcribed text appends to the node

### Keyboard-First Navigation

You can build and navigate an entire graph without touching the mouse after the first node.

| Key | Action |
|---|---|
| `Tab` (on empty node) | Nudge node right (indent) |
| `Shift+Tab` (on empty node) | Nudge node left (unindent) |
| `Tab` (on filled node) | Save, create child node below-right with explicit edge |
| `Shift+Enter` | Save, create sibling node directly below with explicit edge |
| `Shift+↑ / ↓ / ← / →` | Reposition the current node in that direction |
| `Enter` | Save and close popover |
| `Escape` | Close popover (discards if node is empty) |

**Tab + Shift+Enter chains:** you can build an entire branching outline using only `Tab` and `Shift+Enter` — never touching the mouse. Shift+arrows let you fine-tune position at any point.

### Subtree Actions

`Shift+click` any node to select its entire subtree (the node plus all descendants, via BFS traversal). Once selected, a hint bar appears with the count and available actions.

| Action | How |
|---|---|
| **Move subtree** | Drag any selected node — the whole subtree moves together |
| **Copy as text** | `Cmd/Ctrl+C` or the "Copy Text" button — copies the subtree as indented markdown bullets |
| **Delete subtree** | `Delete` / `Backspace` with selection active |
| **Detach subtree** | "Detach" button — cuts the edge connecting the subtree root to its parent |
| **Reattach subtree** | Long-press drag from any node, release on an existing node — creates an edge; Jewel rejects cycles and nodes that already have a parent |

Click empty space to clear the selection.

### Heading Hierarchy

Prefix node text with `#`, `##`, or `###` to set heading level. The `#` is stripped from the display label and the font size and weight adjust automatically. Use this to give structure to a canvas without imposing a formal hierarchy.

### Session Colors

Every browser session gets a unique color from a rotating palette. Nodes and edges created in that session render in that color, so you can see at a glance which thoughts came from which visit.

You can change session colors after the fact in the Settings panel — both for today's session and past sessions. Colors update live on the canvas without a reload.

### Settings

The gear icon (top-right) opens the settings panel. Everything persists to `localStorage`.

- **Font sizes** for H1, H2, H3, and default nodes
- **Question node color** — any node whose text ends with `?` renders in this color
- **Session color editor** — change today's color or any past session's color
- **Text wrap length** — controls when node labels wrap to a new line
- **Tab indent X/Y** and **Shift+Enter indent Y** — tune the spacing used by keyboard navigation

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Neon](https://neon.tech) Postgres database (free tier works)
- A Google OAuth app (for sign-in)

### 1. Clone and install

```bash
git clone https://github.com/your-username/jewel.git
cd jewel
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```bash
# .env.local

DATABASE_URL=          # Neon Postgres connection string (pooled or direct)
NEXTAUTH_SECRET=       # Any random string, e.g. output of: openssl rand -base64 32
NEXTAUTH_URL=          # http://localhost:3000 for local dev
GOOGLE_CLIENT_ID=      # From Google Cloud Console
GOOGLE_CLIENT_SECRET=  # From Google Cloud Console
```

#### Getting a Neon database URL

1. Go to [neon.tech](https://neon.tech) and create a free project
2. In your project dashboard, click **Connection Details**
3. Copy the **pooled connection string** — it starts with `postgresql://`
4. Paste it as `DATABASE_URL` in `.env.local`

#### Getting Google OAuth credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
4. Application type: **Web application**
5. Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**
6. Copy the **Client ID** and **Client secret** into `.env.local`

### 3. Run migrations

```bash
pnpm db:migrate
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with Google, and your first canvas is created automatically.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Canvas | D3 v7 |
| Animations | Framer Motion |
| ORM | Drizzle ORM |
| Database | Neon (Postgres) |
| Auth | NextAuth.js v5 (Google OAuth) |
| Package manager | pnpm |
| Deploy | Vercel |

---

## Deployment

Jewel deploys to Vercel with zero config.

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` in the Vercel project settings
4. Update `NEXTAUTH_URL` to your production domain
5. Add your production callback URL to Google OAuth: `https://your-domain.com/api/auth/callback/google`
6. Deploy

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Root canvas page
│   ├── layout.tsx                # Root layout + SessionProvider
│   └── api/                      # API routes (canvases, nodes, edges, auth)
├── components/
│   ├── Canvas.tsx                # D3 canvas — all interaction logic
│   ├── NodePopover.tsx           # Edit popover + voice input
│   ├── SettingsPanel.tsx         # Settings panel UI
│   └── PastSessionsDropdown.tsx  # Session color editor components
├── lib/
│   ├── db.ts                     # Drizzle client
│   ├── nearest.ts                # Euclidean nearest-node util
│   ├── subtree.ts                # BFS subtree traversal + copy + cycle detection
│   ├── sessionColor.ts           # Session color palette + cycling
│   ├── settings.ts               # CanvasSettings interface + useSettings hook
│   └── retry.ts                  # withRetry with exponential backoff
└── schema/
    └── index.ts                  # Drizzle table definitions
```

---

## License

MIT
