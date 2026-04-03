# BUILT.md

## Current State
Auth + landing + collapsible sidebar complete. NextAuth v5 Google OAuth. Protected canvas routes. Landing page with hero and features grid. Sidebar animates open/closed via Framer Motion, state in SidebarContext, persisted to localStorage. Canvas switching is stable — sidebar stays mounted, reads current canvas from usePathname().

## Feature Docs

| Feature | Status | File |
|---|---|---|
| Canvas Interactions | ✅ Built | `docs/features/canvas-interactions.md` |
| Node Editing | ✅ Built | `docs/features/node-editing.md` |
| Appearance | ✅ Built | `docs/features/appearance.md` |
| Persistence | ✅ Built | `docs/features/persistence.md` |
| Auth + Canvas Management | ✅ Built | `docs/features/auth.md` |
| Voice Input | 🔲 Planned | `docs/features/voice-input.md` |
| Streak + Activity | 🔲 Planned | `docs/features/streak.md` |
| Polish + Ship | 🔲 Planned | `docs/features/polish-and-ship.md` |

## Current File Tree
```
src/
  app/
    api/
      auth/
        [...nextauth]/route.ts
        post-signin/route.ts
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
    canvas/
      [id]/page.tsx
      layout.tsx
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
  components/
    Canvas.tsx
    CanvasPage.tsx
    Markdown.tsx
    Markdown/markdown.css
    NodePopover.tsx
    PastSessionsDropdown.tsx
    SettingsPanel.tsx
    Sidebar.tsx
    SidebarItem.tsx
    SidebarToggle.tsx
    landing/
      FeaturesGrid.tsx
      Hero.tsx
  context/
    SidebarContext.tsx
  lib/
    auth.ts
    db.ts
    nearest.ts
    retry.ts
    settings.ts
    subtree.
    ts
    sessionColor.ts
  middleware.ts
  schema/
    index.ts
  types/
    index.ts
    next-auth.d.ts
```
