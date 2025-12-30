/**
 * Database Schema Index
 * Export all tables for Drizzle Kit and application use
 */

// Auth tables (Better Auth)
export { user, session, account, verification } from "./auth";

// Custom tables
export { repository, type Repository, type NewRepository } from "./repositories";
export { job, type Job, type NewJob } from "./jobs";
export { issue, type Issue, type NewIssue } from "./issues";
