import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// Database configuration
const DB_NAME = "TimelineAppDB";
const DB_VERSION = 4; // Incremented for new schema

// Store names
const TASKS_STORE = "tasks";
const EVENTS_STORE = "events"; 
const NOTES_STORE = "notes";
const PROJECTS_STORE = "projects";
const COLLECTIONS_STORE = "collections";

// Base interfaces
export interface BaseRecord {
  id?: number;
  createdAt: Date;
}

// Entity-specific interfaces
export interface TaskRecord extends BaseRecord {
  type: "task";
  content: string;
  status: "todo" | "in-progress" | "done";
  projectId?: number;
}

export interface EventRecord extends BaseRecord {
  type: "event";
  content: string;
  projectId?: number;
  collectionId?: number;
  eventDate?: Date;
}

export interface NoteRecord extends BaseRecord {
  type: "default" | "note";
  content: string;
  collectionId?: number;
}

export interface ProjectRecord extends BaseRecord {
  name: string;
}

export interface CollectionRecord extends BaseRecord {
  name: string;
}

// Database schema typing
interface TimelineDB extends DBSchema {
  [TASKS_STORE]: {
    key: number;
    value: TaskRecord;
    indexes: { 
      'status': string;
      'projectId': number;
    };
  };
  [EVENTS_STORE]: {
    key: number;
    value: EventRecord;
    indexes: { 
      'projectId': number;
      'collectionId': number;
      'eventDate': Date;
    };
  };
  [NOTES_STORE]: {
    key: number;
    value: NoteRecord;
    indexes: { 
      'collectionId': number;
    };
  };
  [PROJECTS_STORE]: {
    key: number;
    value: ProjectRecord;
    indexes: { 'name': string };
  };
  [COLLECTIONS_STORE]: {
    key: number;
    value: CollectionRecord;
    indexes: { 'name': string };
  };
}

// Singleton database connection
let dbPromise: Promise<IDBPDatabase<TimelineDB>> | null = null;

// Get database connection
export function getDb(): Promise<IDBPDatabase<TimelineDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB cannot be accessed server-side.")
    );
  }

  if (!dbPromise) {
    dbPromise = openDB<TimelineDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Creating new database version ${newVersion}`);

        // Create tasks store
        if (!db.objectStoreNames.contains(TASKS_STORE)) {
          const taskStore = db.createObjectStore(TASKS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          taskStore.createIndex("status", "status");
          taskStore.createIndex("projectId", "projectId");
          console.log(`Created tasks store with indexes`);
        }

        // Create events store
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const eventStore = db.createObjectStore(EVENTS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          eventStore.createIndex("projectId", "projectId");
          eventStore.createIndex("collectionId", "collectionId");
          eventStore.createIndex("eventDate", "eventDate");
          console.log(`Created events store with indexes`);
        }

        // Create notes store
        if (!db.objectStoreNames.contains(NOTES_STORE)) {
          const noteStore = db.createObjectStore(NOTES_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          noteStore.createIndex("collectionId", "collectionId");
          console.log(`Created notes store with indexes`);
        }

        // Create projects store
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          const projectStore = db.createObjectStore(PROJECTS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          projectStore.createIndex("name", "name", { unique: true });
          console.log(`Created projects store with indexes`);
        }

        // Create collections store
        if (!db.objectStoreNames.contains(COLLECTIONS_STORE)) {
          const collectionsStore = db.createObjectStore(COLLECTIONS_STORE, {
            keyPath: "id",
            autoIncrement: true,
          });
          collectionsStore.createIndex("name", "name", { unique: true });
          console.log(`Created collections store with indexes`);
        }

        console.log("Database setup complete");
      },
      blocked() {
        console.warn("IndexedDB upgrade blocked by another connection");
      },
      blocking() {
        console.warn("This connection is blocking a newer version");
      },
      terminated() {
        console.error("IndexedDB connection was unexpectedly terminated");
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

// Generic CRUD operations that work with any store

// Add item to a store
export async function addItem<T extends BaseRecord>(
  storeName: string,
  item: Omit<T, "id"> & { createdAt?: Date }
): Promise<number> {
  const db = await getDb();
  const itemToAdd = {
    ...item,
    createdAt: item.createdAt || new Date(),
  } as T;
  
  const id = await db.add(storeName, itemToAdd);
  console.log(`Item added to ${storeName}, ID:`, id);
  return id;
}

// Get all items from a store
export async function getAllItems<T extends BaseRecord>(
  storeName: string
): Promise<T[]> {
  const db = await getDb();
  const items = await db.getAll(storeName);
  
  // Ensure dates are Date objects (needed because IndexedDB serializes dates)
  return items.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    ...(item as any).eventDate && { eventDate: new Date((item as any).eventDate) },
  } as T));
}

// Get item by ID
export async function getItemById<T extends BaseRecord>(
  storeName: string,
  id: number
): Promise<T | null> {
  const db = await getDb();
  const item = await db.get(storeName, id);
  
  if (!item) return null;
  
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    ...(item as any).eventDate && { eventDate: new Date((item as any).eventDate) },
  } as T;
}

// Update item
export async function updateItem<T extends BaseRecord>(
  storeName: string,
  item: T
): Promise<void> {
  if (!item.id) {
    throw new Error(`Cannot update item in ${storeName} without ID`);
  }

  const db = await getDb();
  await db.put(storeName, item);
  console.log(`Item updated in ${storeName}, ID:`, item.id);
}

// Delete item
export async function deleteItem(
  storeName: string,
  itemId: number
): Promise<void> {
  const db = await getDb();
  await db.delete(storeName, itemId);
  console.log(`Item deleted from ${storeName}, ID:`, itemId);
}

// Delete multiple items
export async function deleteItems(
  storeName: string,
  itemIds: number[]
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(storeName, 'readwrite');
  
  await Promise.all([
    ...itemIds.map(id => tx.store.delete(id)),
    tx.done
  ]);
  
  console.log(`${itemIds.length} items deleted from ${storeName}`);
}

// Query by index
export async function getItemsByIndex<T extends BaseRecord>(
  storeName: string,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = await getDb();
  const index = db.transaction(storeName).store.index(indexName);
  const items = await index.getAll(value);
  
  return items.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    ...(item as any).eventDate && { eventDate: new Date((item as any).eventDate) },
  } as T));
}