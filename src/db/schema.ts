import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Define an enum for item types for better type safety
export const itemTypes = ['task', 'spend', 'event', 'default'] as const;
export type ItemType = typeof itemTypes[number];

export const timelineItems = pgTable('timeline_items', {
  id: serial('id').primaryKey(), // Auto-incrementing primary key
  type: varchar('type', { length: 10, enum: itemTypes }).notNull().default('default'), // Type of the item
  content: text('content').notNull(), // The actual text content
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(), // Timestamp of creation
});

// Define TypeScript types for inserting and selecting data (optional but recommended)
export type TimelineItem = typeof timelineItems.$inferSelect; // Type for selecting items
export type NewTimelineItem = typeof timelineItems.$inferInsert; // Type for inserting items
