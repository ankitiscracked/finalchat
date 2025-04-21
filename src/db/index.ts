import { drizzle, type PGliteDatabase } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema'; // Import the schema

// Type definition for the Drizzle instance based on our schema
export type DbInstance = PGliteDatabase<typeof schema>;

// Singleton instance holder - initialized lazily
let dbInstance: DbInstance | null = null;

/**
 * Initializes and returns the PGlite database instance.
 * Ensures that initialization only happens once and client-side.
 * Throws an error if called server-side.
 */
export async function getDb(): Promise<DbInstance> {
  // Ensure this function is only called client-side
  if (typeof window === 'undefined') {
    throw new Error('Database initialization cannot occur on the server side.');
  }

  if (dbInstance) {
    return dbInstance;
  }

  console.log("Initializing PGlite database client-side...");
  // Initialize PGlite database. Data will be persisted in IndexedDB.
  // 'timeline-db' is the name of the IndexedDB database.
  // PGlite constructor might involve async operations internally for setup.
  const client = new PGlite('timeline-db');

  // Wait for the client to be ready (important step)
  // Although PGlite constructor isn't explicitly async, awaiting ready ensures
  // underlying structures like IndexedDB are prepared.
  await client.waitReady;
  console.log("PGlite client is ready.");


  // Create the Drizzle instance using the PGlite client and the defined schema
  dbInstance = drizzle(client, { schema });
  console.log("Drizzle ORM instance created.");

  // Optional: Run migrations automatically on startup if needed
  // This is a simplified approach; proper migration handling is recommended.
  // try {
  //   console.log("Applying migrations if necessary...");
  //   // Import migration SQL (assuming drizzle-kit generated it)
  //   // const migrationSql = await import('../../drizzle/meta/0000_snapshot.sql?raw');
  //   // await client.exec(migrationSql.default);
  //   console.log("Migrations checked/applied.");
  // } catch (migrationError) {
  //   console.error("Error applying migrations:", migrationError);
  // }

  return dbInstance;
}
