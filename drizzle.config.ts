import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://chatbot_user:chatbot_password@localhost:5432/chatbot_service',
  },
} satisfies Config;

