# Architecture

## Overview

A Next.js 14 App Router application. The frontend is a D3 canvas component mounted inside a React page. The backend is Next.js API routes backed by Drizzle + Neon Postgres. Auth is NextAuth with Google OAuth. No external services beyond the DB and auth provider.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, API routes, server components |
| Language | TypeScript | End-to-end type safety |
| Styling | Tailwind CSS | Utility-first, no CSS files to manage |
| Animation | Framer Motion | UI transitions (not canvas) |
| Canvas | D3 v7 | SVG rendering, drag, zoom, force layout |
| ORM | Drizzle ORM | Lightweight, TypeScript-native, great DX |
| Database | Neon (Postgres) | Serverless Postgres, free tier, works with Drizzle |
| Auth | NextAuth.js v5 | Google OAuth, session management |
| Package manager | pnpm | Fast, disk-efficient |
| Deploy | Vercel | Zero-config Next.js deployment |

---

## Repository Structure

```
/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Landing / sign-in redirect
│   │   ├── layout.tsx                      # Root layout, SessionProvider
│   │   ├── canvas/
│   │   │   └── [id]/
│   │   │       └── page.tsx                # Main canvas view
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts            # NextAuth handler
│   │       ├── canvases/
│   │       │   ├── route.ts                # GET list, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts            # GET one, PATCH rename, DELETE
│   │       ├── nodes/
│   │       │   ├── route.ts                # POST create
│   │       │   └── [id]/
│   │       │       └── route.ts            # PATCH update, DELETE
│   │       └── edges/
│   │           ├── route.ts                # POST create
│   │           └── [id]/
│   │               └── route.ts            # DELETE
│   ├── components/
│   │   ├── Canvas.tsx                      # D3 canvas (core component)
│   │   ├── NodePopover.tsx                 # Edit popover with voice input
│   │   ├── Sidebar.tsx                     # Canvas list + management
│   │   └── StreakBadge.tsx                 # Streak counter in nav
│   ├── lib/
│   │   ├── db.ts                           # Drizzle client singleton
│   │   ├── auth.ts                         # NextAuth config
│   │   ├── nearest.ts                      # Euclidean nearest-node util
│   │   └── streak.ts                       # Streak calculation logic
│   ├── schema/
│   │   └── index.ts                        # Drizzle table definitions
│   └── types/
│       └── index.ts                        # Shared TypeScript types
├── drizzle/
│   └── migrations/                         # Auto-generated migration files
├── drizzle.config.ts                       # Drizzle Kit config
├── .env.local                              # Local secrets (gitignored)
└── .env.example                            # Template for required env vars
```

---

## Component Architecture

### `Canvas.tsx`
The core of the app. A React component that mounts a D3 SVG inside a `useRef`. All canvas logic lives here.

**Responsibilities:**
- Initialize D3 svg, zoom behavior, pan behavior
- Render nodes as `<circle>` + `<text>` label pairs
- Render edges as `<path>` elements with arrowhead markers
- Handle click on empty space → create node → auto-connect to nearest → call `onNodeCreate`
- Handle long-press on existing node + drag outward → rubber-band preview line follows cursor → release creates new node at drop position with explicit edge from source → call `onNodeCreateFromEdge`
- Handle short click/drag on node (no long-press threshold met) → reposition → call `onNodeMove`
- Handle click on node → open `NodePopover`
- Compute nearest node on tap-to-create (via `nearest.ts`)
- Render rubber-band preview line during long-press drag (dashed, follows cursor, not committed to state)
- Re-render on node/edge state changes via D3 data joins

**Does not own state.** Receives `nodes`, `edges`, and callbacks as props. Parent page owns the state and API calls.

```typescript
interface CanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodeCreate: (x: number, y: number) => Promise<Node>           // tap empty space
  onNodeCreateFromEdge: (sourceId: string, x: number, y: number) => Promise<Node>  // long-press drag
  onNodeMove: (id: string, x: number, y: number) => void
  onNodeSelect: (node: Node) => void
}
```

### `NodePopover.tsx`
Floating edit popover that appears when a node is selected.

**Responsibilities:**
- Textarea for text input (auto-focused on open)
- Mic button for voice input via Web Speech API
- URL field (collapsed by default, expandable)
- Save on blur, Enter, or explicit confirm
- Delete button (with confirmation)
- Positioned relative to node coordinates in canvas space

### `Sidebar.tsx`
Left panel listing all canvases for the current user.

**Responsibilities:**
- List canvases sorted by `updatedAt` descending
- Active canvas highlighted
- Inline rename on double-click
- Delete canvas with confirmation dialog
- "New canvas" button at top

### `StreakBadge.tsx`
Small stateless display component. Receives `streak: number` as prop. Renders `🔥 {streak}` in the nav.

---

## Data Flow

### Creating a node

```
User taps empty canvas space
  → Canvas.tsx captures click coordinates (adjusted for zoom/pan transform)
  → Calls onNodeCreate(x, y) on parent page
  → Parent calls POST /api/nodes { canvasId, x, y }
  → API route:
      1. Creates node in DB
      2. Finds nearest existing node (Euclidean distance query)
      3. If nearest exists, creates edge (fromId=nearest, toId=new)
      4. Upserts activityLog for today
      5. Returns { node, edge | null }
  → Parent updates local state optimistically (already done before API call)
  → API response reconciles IDs
  → Canvas re-renders with new node and edge
```

### Creating a node via long-press drag

```
User long-presses an existing node (threshold: ~300ms)
  → Canvas enters "edge-draw" mode for that source node
  → Source node highlights (ring or glow)
  → A dashed rubber-band line renders from source node center, following cursor
  → User drags outward to desired position
  → On mouse/pointer up:
      If released on empty space:
        → Calls onNodeCreateFromEdge(sourceId, x, y)
        → Parent calls POST /api/nodes { canvasId, x, y, explicitFromId: sourceId }
        → API route:
            1. Creates node in DB
            2. Creates edge (fromId=sourceId, toId=new) — skips nearest logic
            3. Upserts activityLog for today
            4. Returns { node, edge }
        → Rubber-band line replaced by real edge
        → NodePopover opens on new node immediately
      If released on existing node:
        → Creates edge between source and target node (no new node)
        → Calls onEdgeCreate(sourceId, targetId)
      If released back on source node or dragged < 10px:
        → Cancelled, no node or edge created
```

### Moving a node

```
User drags node
  → D3 drag handler fires on every tick
  → Canvas updates node position in local state immediately (smooth drag)
  → On drag end: calls onNodeMove(id, finalX, finalY)
  → Parent calls PATCH /api/nodes/:id { x, y }
  → DB updated, no re-render needed (position already correct in state)
```

### Loading a canvas

```
User navigates to /canvas/:id
  → Next.js page component (server component) fetches canvas + nodes + edges
  → Passes as props to Canvas.tsx (client component)
  → D3 initializes with pre-loaded data
  → No loading flash for initial render
```

---

## API Routes

### Canvases
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/canvases` | List all canvases for current user |
| `POST` | `/api/canvases` | Create new canvas, returns canvas with empty nodes/edges |
| `GET` | `/api/canvases/:id` | Fetch canvas with all nodes and edges |
| `PATCH` | `/api/canvases/:id` | Rename canvas |
| `DELETE` | `/api/canvases/:id` | Delete canvas (cascades to nodes + edges) |

### Nodes
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/nodes` | Create node. If `explicitFromId` provided, creates edge from that node (skips nearest logic). Otherwise auto-connects to nearest. Logs activity either way. |
| `PATCH` | `/api/nodes/:id` | Update text, url, or position |
| `DELETE` | `/api/nodes/:id` | Delete node (cascades to edges) |

### Edges
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/edges` | Create edge explicitly (used when long-press drag released on existing node) |
| `DELETE` | `/api/edges/:id` | Delete edge |

All routes require a valid session. Return `401` if unauthenticated. Return `403` if the resource doesn't belong to the current user.

---

## Interaction Design

### Two Node Creation Modes

| Interaction | Result | Edge source |
|---|---|---|
| Tap empty space | New node at tap position | Auto-nearest existing node |
| Long-press node + drag + release on empty space | New node at release position | Explicitly the long-pressed node |
| Long-press node + drag + release on existing node | No new node, new edge only | Long-pressed → released-on node |

**Long-press threshold:** 300ms. Under 300ms on a node = short click = select/edit or reposition. Over 300ms = enter edge-draw mode.

**Drag distance cancel threshold:** If user long-presses but releases within 10px of origin, treat as a click (open popover), not a node creation.

**Rubber-band line:** Rendered as a dashed SVG path in D3, drawn from source node center to current cursor position. Lives in a separate D3 selection layer so it never interferes with real edges. Removed immediately on mouse up regardless of outcome.

---

## Key Utilities

### `nearest.ts`
Finds the nearest node to a given `(x, y)` coordinate.

```typescript
// Pure function — takes node list, returns nearest node or null
export function findNearest(
  nodes: Node[],
  x: number,
  y: number,
  excludeId?: string
): Node | null {
  if (nodes.length === 0) return null;
  return nodes
    .filter(n => n.id !== excludeId)
    .reduce((closest, node) => {
      const d = Math.hypot(node.x - x, node.y - y);
      const dClosest = Math.hypot(closest.x - x, closest.y - y);
      return d < dClosest ? node : closest;
    });
}
```

Called both in the API route (to auto-create edges) and in `Canvas.tsx` (for visual preview of which node will be connected before the user lifts their finger — future enhancement).

### `streak.ts`
Calculates current streak from an array of activity dates.

```typescript
// Returns current consecutive-day streak ending today (or yesterday)
export function calculateStreak(dates: string[]): number
```

---

## Auth Flow

```
User hits app unauthenticated
  → Middleware redirects to /
  → Landing page shows "Sign in with Google" button
  → NextAuth redirects to Google OAuth consent
  → Google redirects back to /api/auth/callback/google
  → NextAuth creates/updates user row in DB
  → Session cookie set (httpOnly JWT)
  → Redirect to most recent canvas, or create first canvas if none
```

Session is available server-side via `getServerSession()` and client-side via `useSession()`.

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=                  # Neon Postgres connection string

# Auth
NEXTAUTH_SECRET=               # Random secret for JWT signing
NEXTAUTH_URL=                  # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=              # From Google Cloud Console
GOOGLE_CLIENT_SECRET=          # From Google Cloud Console
```

---

## Performance Considerations

**Optimistic updates.** All mutations update local state before the API call resolves. Users never wait for the server on node creation or drag.

**Server component initial load.** The canvas page fetches data server-side, so the initial render has data — no loading spinner on first paint.

**D3 data joins.** Canvas re-renders use D3's enter/update/exit pattern, not a full DOM teardown. Only changed nodes and edges are touched.

**No real-time sync.** MVP is single-user, single-tab. No WebSockets or polling needed. Multi-tab and collaborative features are explicitly out of scope.

---

## What's Explicitly Out of Scope (MVP)

- Real-time collaboration
- Mobile app (React Native)
- Public canvas sharing
- Semantic clustering / embeddings
- Force-directed auto-layout
- Manual edge creation (all edges are auto-nearest)
- Offline support