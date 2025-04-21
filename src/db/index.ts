import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema'; // Import the schema we just defined

// Initialize PGlite database. Data will be persisted in IndexedDB.
// 'timeline-db' is the name of the IndexedDB database.
const client = new PGlite('timeline-db');

// Create the Drizzle instance using the PGlite client and the defined schema
export const db = drizzle(client, { schema });

// We might need to run migrations here in a real application setup,
// but for simplicity in this browser context, we'll handle schema creation
// via Drizzle Kit generation and assume the table exists or handle it in main.js.
// In a production scenario, you'd use Drizzle Kit's migration capabilities.
console.log("PGlite database initialized and Drizzle ORM is ready.");
