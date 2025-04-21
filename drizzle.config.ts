import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts', // Path to your schema file
  out: './drizzle', // Directory to output migration files
  driver: 'pg', // Specify 'pg' driver for PGlite compatibility
  dbCredentials: {
    // PGlite doesn't need traditional credentials for generation,
    // but drizzle-kit requires the structure. Use dummy values.
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'timeline-db', // Match the PGlite DB name if needed for consistency
  },
  verbose: true, // Optional: Show detailed logs during generation
  strict: true, // Optional: Enable strict mode for type checking
} satisfies Config;
