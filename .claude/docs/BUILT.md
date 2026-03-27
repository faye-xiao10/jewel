# BUILT.md

## Current State
Stage 2 complete. Full persistence layer with Drizzle + Neon. Nodes are only written to DB when the user saves content — never on bare click. State survives refresh via localStorage canvas ID.

## Steps Completed

### Step 0 — Scaffold (2026-03-27)
Bootstrapped with `pnpm create next-app@latest`. Added D3, Framer Motion, Prettier.

---

### Stage 1 — Core D3 Canvas (2026-03-27)
Full canvas interaction: click to create nodes, auto-connect to nearest neighbor, drag, long-press edge-draw, pan/zoom. Node popover for edit/delete. All state in React useState.

---

### Stage 2 — Persistence (2026-03-27)
Drizzle ORM + Neon Postgres. All mutations backed by API routes. Write-on-save pattern: temp nodes live only in local state until the user types and saves.

**Write-on-save flow:**
- Click/long-press creates a temp node (`temp_${Date.now()}`) in local state only — no DB write
- Temp metadata (explicitFromId, tempEdgeId) stored in `tempMetaRef`
- `onSave`: if id starts with `temp_`, POSTs to `/api/nodes` with text + position, reconciles temp IDs with real IDs in both nodes and edges state
- `onDiscard`: removes temp node/edge from state only — no DB call
- `onDelete`: for real nodes, optimistic remove + DELETE API with rollback on failure
- `onNodeMove`: updates state; skips PATCH for temp nodes

**API routes (all wrap DB calls in withRetry):**
- `GET/POST /api/canvases` — list all / create
- `GET/PATCH/DELETE /api/canvases/[id]` — fetch with nodes+edges / rename / delete
- `POST /api/nodes` — insert node (accepts text at creation), auto-nearest edge or explicitFromId
- `PATCH/DELETE /api/nodes/[id]` — partial update / delete cascade
- `POST /api/edges` — create edge, validates no self-loops
- `DELETE /api/edges/[id]` — delete edge

**Key fixes during Stage 2:**
- `neon-http` driver doesn't support transactions — removed `db.transaction()`, inserts run sequentially
- `console.error` added to `/api/nodes` POST for visibility

**Files created/changed:**
- `src/types/index.ts` — added Canvas interface
- `src/lib/retry.ts` — withRetry() exponential backoff + jitter
- `src/lib/db.ts` — Drizzle singleton via neon-http
- `src/schema/index.ts` — canvases (userId nullable), nodes, edges
- `drizzle.config.ts` — points to src/schema, out drizzle/migrations
- `drizzle/migrations/` — generated + applied to Neon
- `src/app/api/canvases/route.ts`
- `src/app/api/canvases/[id]/route.ts`
- `src/app/api/nodes/route.ts`
- `src/app/api/nodes/[id]/route.ts`
- `src/app/api/edges/route.ts`
- `src/app/api/edges/[id]/route.ts`
- `src/app/page.tsx` — full rewrite with write-on-save pattern, tempMetaRef, nodesRef

## Current File Tree
```
src/
  app/
    api/
      canvases/
        [id]/route.ts
        route.ts
      edges/
        [id]/route.ts
        route.ts
      nodes/
        [id]/route.ts
        route.ts
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  components/
    Canvas.tsx
    NodePopover.tsx
  lib/
    db.ts
    nearest.ts
    retry.ts
  schema/
    index.ts
  types/
    index.ts
```
