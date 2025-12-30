/**
 * Better Auth - Server Configuration
 * Initialize Better Auth with GitHub OAuth and Drizzle adapter
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/src/schema";

// Initialize database client
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  
  // Email/password auth (optional, can disable if only using GitHub)
  emailAndPassword: {
    enabled: false,
  },
  
  // GitHub OAuth
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Request repo scope to access user's repositories
      scope: ["read:user", "user:email", "repo"],
    },
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
