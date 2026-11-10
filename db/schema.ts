import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  program: text("program").notNull(),
  role: text("role").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("staff_email_unique").on(table.email)]);

export const shoutouts = sqliteTable("shoutouts", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => staff.id),
  recipientId: text("recipient_id").notNull().references(() => staff.id),
  message: text("message").notNull(),
  points: integer("points").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey(),
  shoutoutId: text("shoutout_id").notNull().references(() => shoutouts.id),
  authorId: text("author_id").notNull().references(() => staff.id),
  message: text("message").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const likes = sqliteTable("likes", {
  id: text("id").primaryKey(),
  authorId: text("author_id").notNull().references(() => staff.id),
  shoutoutId: text("shoutout_id").references(() => shoutouts.id),
  commentId: text("comment_id").references(() => comments.id),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("likes_shoutout_unique").on(table.authorId, table.shoutoutId),
  uniqueIndex("likes_comment_unique").on(table.authorId, table.commentId),
]);
