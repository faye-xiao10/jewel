# BUILT.md

## Current State
Stage 2 complete + post-stage polish. Full persistence layer with Drizzle + Neon. Nodes are only written to DB when the user saves content — never on bare click. State survives refresh via localStorage canvas ID. Canvas settings persisted to localStorage.

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

---

### Post-Stage 2 Polish (2026-03-28)

**Bug fixes:**
- Ghost node bug: `onSave` was firing on blur even after discard, writing empty nodes to DB. Fixed with `discardedRef` — a Set that marks node IDs as discarded before any save can fire
- Popover re-opening bug: `setSelectedNode(saved)` after temp node save was re-opening the popover. Changed to `setSelectedNode(null)`
- Double node creation on blur: clicking away fired both `onSave` (blur) and `onNodeCreate` (canvas click). Fixed by setting `suppressNextCreateRef.current = true` at the top of `onSave`
- Ghost node filter in API: nearest-node query now excludes nodes with no text and no url to prevent ghost nodes from poisoning future edge connections
- Ghost edge on multi-select drag end: canvas click after drag was creating a node. Fixed by checking `selectedNodeIds.size > 0` in click handler and returning early
- Duplicate `page.tsx` content caused by paste error — cleaned up

**Keyboard shortcuts:**
- `Tab` on empty node — moves node right by `tabIndentX`
- `Shift+Tab` on empty node — moves node left by `tabIndentX`
- `Tab` on filled node — saves current node, creates child node at `(x + tabIndentX, y + tabIndentY)` with explicit edge
- `Shift+Enter` while editing — saves current node, creates new node directly below at `(x, y + shiftEnterIndentY)` with explicit edge
- Tab/Shift+Enter are no-ops if node has no text and no movement applies
- Both await `onSave` to resolve before calling `onNodeCreateFromEdge` so the real node ID is used as edge source
- `onSave` now returns `Promise<string>` (the real node ID after DB write)
- `Delete`/`Backspace` — deletes all selected nodes when selection is active and no textarea is focused

**Markdown-style hierarchy on canvas:**
- Node labels styled by `#` prefix: `# ` = H1, `## ` = H2, `### ` = H3
- Font size, weight vary by heading level
- `#` prefix stripped from display label
- Text wrapping via `wrapText()` helper using `<tspan>` elements — wrap length configurable via settings
- Question nodes: if `node.text` ends with `?`, node dot and label render in `questionColor`

**Multi-select:**
- Shift+click a node = select entire subtree rooted at that node (BFS following directed edges)
- Dragging a selected node when multiple are selected moves all together, PATCHes all on drag end
- Click empty space clears selection
- `selectedNodeIds: Set<string>` state in `page.tsx`, passed to Canvas as prop
- Selection ring rendered as `circle.select-ring` in D3, opacity toggled by selection state
- Small hint bar at bottom of screen: "N nodes selected · Press Delete to remove"
- Subtree util in `src/lib/subtree.ts` — BFS from root following `fromId → toId` edges

**Canvas Settings panel:**
- Gear icon (top-right) opens settings panel
- Settings persisted to `localStorage` under key `jewel_settings`
- Configurable: H1/H2/H3/default font sizes, node color, edge color, question color, wrap length, Tab indent X/Y, Shift+Enter indent Y
- Each setting has a slider + typeable number input (sliders and inputs stay in sync)
- Color settings have a color picker + typeable hex input
- No horizontal scroll; fixed 300px width
- Reset to defaults button
- Spinner arrows hidden on number inputs via `globals.css`

**Files created/changed:**
- `src/app/page.tsx` — discardedRef, suppressNextCreate on save, onSave returns Promise<string>, settings wired in, SettingsPanel rendered, selectedNodeIds state, onNodeMoveMulti, onNodeMultiSelect, onClearSelection, group delete useEffect, selection hint bar
- `src/components/Canvas.tsx` — wrapText helper, tspan-based text rendering, hierarchy font sizes/weights, question color, all colors/sizes driven by settings prop, settingsRef for drag callbacks, selectedNodeIds prop, select-ring circle, multi-node drag logic, multiDragRef, selectedNodeIdsRef
- `src/components/NodePopover.tsx` — async handleKeyDown, Tab/Shift+Tab node move, Tab/Shift+Enter child node creation, onSave typed as Promise<string>, onNodeMove prop, settings prop for indent values
- `src/components/SettingsPanel.tsx` — new file, gear icon + panel UI, SliderInput + ColorRow sub-components
- `src/lib/settings.ts` — new file, CanvasSettings interface, DEFAULT_SETTINGS, useSettings hook with localStorage persistence
- `src/app/globals.css` — spinner arrows hidden, @plugin typography added

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
    SettingsPanel.tsx
  lib/
    db.ts
    nearest.ts
    retry.ts
    settings.ts
    subtree.ts
  schema/
    index.ts
  types/
    index.ts
```