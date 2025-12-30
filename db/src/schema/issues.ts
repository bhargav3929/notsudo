/**
 * Issues table - GitHub issues that have been processed
 */
import { pgTable, text, integer, timestamp, uuid, serial, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { repository } from "./repositories";

export const issue = pgTable(
  "issue",
  {
    id: serial("id").primaryKey(),
    
    // GitHub issue ID
    githubId: integer("github_id").notNull(),
    
    // References
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    repositoryId: text("repository_id").references(() => repository.id, { onDelete: "cascade" }),
    
    // Issue data from GitHub
    number: integer("number").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    state: text("state").default("open"), // open, closed
    htmlUrl: text("html_url"),
    
    // Processing status
    processedAt: timestamp("processed_at"),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("issue_user_id_idx").on(table.userId),
    index("issue_repository_id_idx").on(table.repositoryId),
    index("issue_github_id_idx").on(table.githubId),
  ]
);

export type Issue = typeof issue.$inferSelect;
export type NewIssue = typeof issue.$inferInsert;
