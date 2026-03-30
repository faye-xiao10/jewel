# BUILT.md

## Current State
Stage 2 complete + post-stage polish. Full persistence layer with Drizzle + Neon. Nodes are only written to DB when the user saves content — never on bare click. State survives refresh via localStorage canvas ID. Canvas settings persisted to localStorage.

## Feature Docs

| Feature | Status | File |
|---|---|---|
| Canvas Interactions | ✅ Built | `docs/features/canvas-interactions.md` |
| Node Editing | ✅ Built | `docs/features/node-editing.md` |
| Appearance | ✅ Built | `docs/features/appearance.md` |
| Persistence | ✅ Built | `docs/features/persistence.md` |
| Auth + Canvas Management | 🔲 Planned | `docs/features/auth.md` |
| Voice Input | 🔲 Planned | `docs/features/voice-input.md` |
| Streak + Activity | 🔲 Planned | `docs/features/streak.md` |
| Polish + Ship | 🔲 Planned | `docs/features/polish-and-ship.md` |

## Current File Tree
```
src/
  app/
    api/
      canvases/
        [id]/
          route.ts
          session-colors/route.ts
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
    Markdown.tsx
    Markdown/markdown.css
    NodePopover.tsx
    PastSessionsDropdown.tsx
    SettingsPanel.tsx
  lib/
    db.ts
    nearest.ts
    retry.ts
    settings.ts
    subtree.ts
    sessionColor.ts
  schema/
    index.ts
  types/
    index.ts
```