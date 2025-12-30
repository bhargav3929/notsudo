/**
 * Jobs table - tracks PR generation jobs
 */
import { pgTable, text, integer, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { repository } from "./repositories";

export const job = pgTable(
  "job",
  {
    id: text("id").primaryKey(),
    
    // References
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    repositoryId: text("repository_id").references(() => repository.id, { onDelete: "set null" }),
    
    // Issue info
    issueNumber: integer("issue_number").notNull(),
    issueTitle: text("issue_title"),
    
    // Job status
    status: text("status").default("processing").notNull(), // processing, completed, failed
    stage: text("stage").default("analyzing"), // analyzing, generating, validating, completed, error
    retryCount: integer("retry_count").default(0).notNull(),
    
    // Results
    prUrl: text("pr_url"),
    error: text("error"),
    logs: jsonb("logs").default([]),
    validationLogs: jsonb("validation_logs").default([]),
    
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("job_user_id_idx").on(table.userId),
    index("job_repository_id_idx").on(table.repositoryId),
    index("job_status_idx").on(table.status),
  ]
);

export type Job = typeof job.$inferSelect;
export type NewJob = typeof job.$inferInsert;
