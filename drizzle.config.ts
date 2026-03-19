import { defineConfig } from 'drizzle-kit';

// Neon database connection URL
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_s7qo4efDZMpG@ep-noisy-surf-amdgjvq3-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
});
