# BUILT.md

## Current State
Stage 1 complete. Core D3 canvas is working — click to create nodes, auto-connect to nearest neighbor, drag to move, long-press to draw edges, pan/zoom. Node popover for editing/deleting. All state in React useState, no backend yet.

## Steps Completed

### Step 0 — Scaffold (2026-03-27)
Bootstrapped project with `pnpm create next-app@latest` (App Router, TypeScript, Tailwind, src dir, `@/*` alias). Added D3, Framer Motion, `@types/d3`, Prettier with `prettier-plugin-tailwindcss`.

**Files changed:**
- `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`
- `.prettierrc` — semi:false, singleQuote, tabWidth:2, trailingComma:es5
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/favicon.ico`
- `public/` — default Next.js SVG assets

---

### Stage 1 — Core D3 Canvas (2026-03-27)
Built the full canvas interaction layer. All state local (no backend).

**Behavior:**
- Click empty space → create node, auto-connect edge to nearest neighbor, open popover
- Drag node → move it, edges stretch live
- Long-press node (300ms) → rubber-band edge-draw mode; release on empty space → new node + edge
- Click node → open popover
- Pan (drag empty space) + scroll zoom (0.1–4×)
- Dark background #0f172a, indigo nodes/edges (#6366f1)
- Node popover: edit text, save on blur/Enter, delete button, Escape to close
- Empty new node dismissed without typing → node + edge deleted, not saved
- Clicking outside popover while empty → discards node, suppresses spurious canvas click (300ms guard)

**Files created/changed:**
- `src/types/index.ts` — `Node` and `Edge` interfaces
- `src/lib/nearest.ts` — `findNearest()` Euclidean distance utility
- `src/components/Canvas.tsx` — D3 SVG canvas (zoom, pan, node/edge data joins, drag, long-press)
- `src/components/NodePopover.tsx` — floating edit popover with save/delete/discard logic
- `src/app/page.tsx` — full rewrite; owns all state, wires canvas + popover
- `src/app/layout.tsx` — simplified; title "Jewel", bg #0f172a

## Current File Tree
```
src/
  app/
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  components/
    Canvas.tsx
    NodePopover.tsx
  lib/
    nearest.ts
  types/
    index.ts
```
