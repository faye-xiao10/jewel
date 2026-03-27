# Learning Journey App — Build Plan


### Stage 1 — Core Canvas (Day 1, ~4 hrs)

Everything that makes this app what it is. No backend yet.

**What you build:**

- Next.js project scaffolded with TypeScript + Tailwind + ESLint + Prettier
- D3 canvas component mounted in a React ref
- Pan (drag background) + zoom (scroll/pinch) on the canvas
- Tap empty space → node appears at click coordinates
- Auto-edge: on node creation, find nearest existing node (Euclidean distance), draw directed arrow to it
- First node ever → no edge (nothing to connect to)
- Click a node → inline edit popover (textarea, auto-focus)
- Drag a node → repositions it, connected edges stretch live
- All state lives in React useState (no DB yet)
- Nodes render as small dots with text label beside them
- Edges render as SVG arrows (D3 line + arrowhead marker)

**Acceptance:**

- `pnpm dev` runs on localhost
- `pnpm lint` passes zero errors
- `pnpm tsc --noEmit` passes
- Tap empty space creates a node at that position
- Each new node auto-connects to nearest existing node
- Long press on a node than move mouse outward will also create a new edge + node when
- When you create a new node it automatically lets you type something into it
- Dragging a node stretches its edges live
- Click a node opens edit popover, text saves on blur/enter
- Pan and zoom work smoothly
- Canvas feels fast and responsive

---

### Stage 2 — Persistence (Day 1, ~2 hrs)

State survives page refresh. Still no auth.

**What you build:**

- Drizzle schema: canvases, nodes, edges tables
- Neon Postgres connection + first migration
- API routes:
  - `GET /api/canvas/:id` — load full canvas (nodes + edges)
  - `POST /api/nodes` — create node
  - `PATCH /api/nodes/:id` — update text or position
  - `DELETE /api/nodes/:id` — delete node + its edges
  - `POST /api/edges` — create edge
  - `DELETE /api/edges/:id`
- Wire canvas actions to API with optimistic updates (UI updates instantly, API call in background)
- Single hardcoded canvas for now (no canvas management yet)
- Loading state on initial canvas fetch

**Acceptance:**

- Drizzle connects to Neon, migration runs clean
- Creating a node persists to DB
- Editing node text persists to DB
- Dragging a node persists final position on drag end
- Page refresh restores full canvas state
- Deleting a node removes it and its edges from DB
- All API routes return meaningful errors on failure

---

### Stage 3 — Canvas Management + Auth (Day 2, ~3 hrs)

Multiple canvases. Real users.

**What you build:**

- NextAuth with Google OAuth
- User table + associate canvases to users
- Left sidebar: list of user's canvases, create new canvas, rename, delete
- Canvas switcher — clicking a canvas in sidebar loads it
- Default canvas name: "Untitled Canvas" (click to rename inline)
- Redirect unauthenticated users to sign-in page
- Sign-out button

**Acceptance:**

- Sign in with Google works, session persists
- Each user only sees their own canvases
- Create new canvas → appears in sidebar → loads blank canvas
- Rename canvas inline in sidebar
- Delete canvas (with confirmation) removes it and all nodes/edges
- Switching canvases loads correct state
- Sign-out clears session, redirects to sign-in

---

### Stage 4 — Voice Input (Day 2, ~1 hr)

Capture thoughts without typing.

**What you build:**

- Mic button inside the node edit popover
- Web Speech API (SpeechRecognition) — browser-native, free, no API key
- Hold to record, release to stop → transcribed text appends to node
- Visual indicator while recording (pulsing mic icon)
- Graceful fallback if browser doesn't support speech API

**Acceptance:**

- Mic button visible in node edit popover
- Clicking mic starts recording, button pulses
- Transcribed text appears in node text field
- Multiple recordings append to existing text
- Error shown gracefully if speech not supported

---

### Stage 5 — Streak + Activity (Day 2, ~1 hr)

Light gamification. Reward showing up.

**What you build:**

- `activityLog` table: userId, date (date only, not timestamp)
- Log an entry whenever a user creates or edits a node (deduplicated per day)
- Streak counter: consecutive days with activity, shown in top nav
- Streak resets if a day is missed
- Small streak display: 🔥 7 — minimal, non-intrusive

**Acceptance:**

- Activity logged on node create or edit
- Streak count correct across multiple days
- Streak resets correctly after a missed day
- Streak visible in nav, updates in real time after node creation

---

### Stage 6 — Polish + Ship (Day 3, ~3 hrs)

Make it feel good. Deploy.

**What you build:**

- Node design polish: smooth appear animation on creation, subtle hover state
- Edge design: curved arrows instead of straight lines (D3 quadratic bezier), arrowhead polish
- Canvas empty state: ghost text "tap anywhere to add a thought" fades out after first node
- Keyboard shortcuts: Escape closes edit popover, Enter confirms and closes
- Delete node: backspace/delete key while node is selected (with no text in popover)
- Mobile: basic touch support (tap to create, tap to edit — drag/pan deferred to later)
- Error boundaries on canvas component
- README: setup instructions, architecture, screenshots
- Deploy to Vercel

**Acceptance:**

- Nodes animate in on creation
- Edges are curved with clean arrowheads
- Empty state shows and disappears correctly
- Keyboard shortcuts work
- Delete node works via keyboard
- `pnpm lint` zero errors
- `pnpm tsc --noEmit` zero errors
- Deployed to Vercel, live link works
- README complete