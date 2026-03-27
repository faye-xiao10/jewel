# Data Model

## Overview

Four tables. Canvases own nodes and edges. Users own canvases. Activity is logged per user per day for streak tracking.

---

## Tables

### `users`
Created by NextAuth on first sign-in.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | cuid, primary key |
| `email` | `text` | unique, not null |
| `name` | `text` | nullable |
| `image` | `text` | avatar URL from Google, nullable |
| `createdAt` | `timestamp` | default now() |

---

### `canvases`
A named spatial canvas. Each user can have many.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | cuid, primary key |
| `userId` | `text` | FK → users.id, cascade delete |
| `name` | `text` | default "Untitled Canvas" |
| `createdAt` | `timestamp` | default now() |
| `updatedAt` | `timestamp` | updated on any mutation |

---

### `nodes`
A single thought on the canvas. All fields except position are optional — no required structure.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | cuid, primary key |
| `canvasId` | `text` | FK → canvases.id, cascade delete |
| `text` | `text` | nullable — typed or voice-transcribed content |
| `url` | `text` | nullable — optional resource link |
| `x` | `real` | canvas x position, not null |
| `y` | `real` | canvas y position, not null |
| `createdAt` | `timestamp` | default now() |
| `updatedAt` | `timestamp` | updated on edit or reposition |

---

### `edges`
A directed connection between two nodes. Created automatically on node creation (source = nearest existing node).

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | cuid, primary key |
| `canvasId` | `text` | FK → canvases.id, cascade delete |
| `fromId` | `text` | FK → nodes.id, cascade delete |
| `toId` | `text` | FK → nodes.id, cascade delete |
| `createdAt` | `timestamp` | default now() |

Constraint: no self-loops (`fromId != toId`). No duplicate edges enforced at app layer.

---

### `activityLog`
One row per user per calendar day. Used for streak calculation.

| Column | Type | Notes |
|---|---|---|
| `id` | `text` | cuid, primary key |
| `userId` | `text` | FK → users.id, cascade delete |
| `date` | `date` | calendar date only (no time), not null |
| `createdAt` | `timestamp` | default now() |

Constraint: unique on `(userId, date)` — one entry per user per day regardless of how many nodes they create.

---

## Relationships

```
User
 └── Canvas (1:many)
      ├── Node (1:many)
      └── Edge (1:many)
           ├── fromId → Node
           └── toId   → Node

User
 └── ActivityLog (1:many)
```

---

## Drizzle Schema

```typescript
// src/schema/index.ts

import { pgTable, text, real, timestamp, date, unique } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const users = pgTable("users", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  email:     text("email").notNull().unique(),
  name:      text("name"),
  image:     text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const canvases = pgTable("canvases", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name:      text("name").notNull().default("Untitled Canvas"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const nodes = pgTable("nodes", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  canvasId:  text("canvas_id").notNull().references(() => canvases.id, { onDelete: "cascade" }),
  text:      text("text"),
  url:       text("url"),
  x:         real("x").notNull(),
  y:         real("y").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const edges = pgTable("edges", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  canvasId:  text("canvas_id").notNull().references(() => canvases.id, { onDelete: "cascade" }),
  fromId:    text("from_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  toId:      text("to_id").notNull().references(() => nodes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityLog = pgTable("activity_log", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date:      date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  uniqueUserDate: unique().on(t.userId, t.date),
}));
```

---

## Key Design Decisions

**No inquiry/root node.** Every node is structurally equal. The canvas itself is the container.

**Position is required on nodes.** `x` and `y` are not null — a node without a position cannot exist. Position is set at creation time from the click coordinates.

**Edges cascade on node delete.** Deleting a node removes all edges where it is `fromId` or `toId`. No orphan edges.

**Auto-edge logic lives at the app layer, not DB.** The DB stores edges; the decision of *which* node to connect to (nearest by Euclidean distance) is computed in the API route at creation time.

**ActivityLog is date-only.** Streak tracking doesn't need sub-day precision. Unique constraint on `(userId, date)` means we can safely upsert on every node creation without double-counting.