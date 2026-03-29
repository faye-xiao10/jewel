import { pgTable, text, real, timestamp } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'

export const canvases = pgTable('canvases', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id'),
  name: text('name').notNull().default('Untitled Canvas'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const nodes = pgTable('nodes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  canvasId: text('canvas_id')
    .notNull()
    .references(() => canvases.id, { onDelete: 'cascade' }),
  text: text('text'),
  url: text('url'),
  color: text('color'),
  x: real('x').notNull(),
  y: real('y').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const edges = pgTable('edges', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  canvasId: text('canvas_id')
    .notNull()
    .references(() => canvases.id, { onDelete: 'cascade' }),
  fromId: text('from_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  toId: text('to_id')
    .notNull()
    .references(() => nodes.id, { onDelete: 'cascade' }),
  color: text('color'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
