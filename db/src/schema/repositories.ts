/**
 * Repositories table - synced from GitHub after OAuth consent
 */
import { pgTable, text, boolean, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const repository = pgTable(
  "repository",
  {
    // GitHub repo ID (as string for flexibility)
    id: text("id").primaryKey(),
    
    // Owner reference
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // GitHub repo data
    name: text("name").notNull(),
    fullName: text("full_name").notNull(), // owner/repo
    description: text("description"),
    isPrivate: boolean("is_private").default(false).notNull(),
    htmlUrl: text("html_url").notNull(),
    defaultBranch: text("default_branch").default("main"),
    language: text("language"),
    
    // Timestamps
    githubCreatedAt: timestamp("github_created_at"),
    githubUpdatedAt: timestamp("github_updated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("repository_user_id_idx").on(table.userId),
    index("repository_full_name_idx").on(table.fullName),
  ]
);

export type Repository = typeof repository.$inferSelect;
export type NewRepository = typeof repository.$inferInsert;
