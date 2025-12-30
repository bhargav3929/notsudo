/**
 * Database Client
 * Initialize Drizzle ORM with PostgreSQL (Supabase)
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Create postgres client
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);

// Export the drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from "./schema";
