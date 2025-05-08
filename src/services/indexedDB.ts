import Dexie, { type Table } from "dexie";

// Database configuration
const DB_NAME = "TimelineAppDB";
const DB_VERSION = 8; // Incremented for new schema

// Store names
const TASKS_STORE = "tasks";
const EVENTS_STORE = "events";
const NOTES_STORE = "notes";
const PROJECTS_STORE = "projects";
const COLLECTIONS_STORE = "collections";

type StoreName =
  | typeof TASKS_STORE
  | typeof EVENTS_STORE
  | typeof NOTES_STORE
  | typeof PROJECTS_STORE
  | typeof COLLECTIONS_STORE;

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
  scheduledAt?: Date;
}

export interface EventRecord extends BaseRecord {
  type: "event";
  content: string;
  projectId?: number;
  collectionId?: number;
  eventDate?: Date;
}

export interface NoteRecord extends BaseRecord {
  type: "note";
  content: string;
  collectionId?: number;
}

export interface ProjectRecord extends BaseRecord {
  name: string;
}

export interface CollectionRecord extends BaseRecord {
  name: string;
}

// Define Dexie database class
class TimelineDB extends Dexie {
  tasks!: Table<TaskRecord>;
  events!: Table<EventRecord>;
  notes!: Table<NoteRecord>;
  projects!: Table<ProjectRecord>;
  collections!: Table<CollectionRecord>;

  constructor() {
    super(DB_NAME);

    // Define database schema
    this.version(DB_VERSION).stores({
      [TASKS_STORE]: "++id, status, projectId, scheduledAt",
      [EVENTS_STORE]: "++id, projectId, collectionId, eventDate",
      [NOTES_STORE]: "++id, collectionId",
      [PROJECTS_STORE]: "++id, &name",
      [COLLECTIONS_STORE]: "++id, &name",
    });

    // Handle date conversion automatically
    this.tasks.hook("reading", convertDates);
    this.events.hook("reading", convertDates);
    this.notes.hook("reading", convertDates);
    this.projects.hook("reading", convertDates);
    this.collections.hook("reading", convertDates);
  }
}

// Helper function to convert dates when reading from database
function convertDates(obj: any) {
  if (obj.createdAt) {
    obj.createdAt = new Date(obj.createdAt);
  }
  if (obj.eventDate) {
    obj.eventDate = new Date(obj.eventDate);
  }
  if (obj.scheduledAt) {
    obj.scheduledAt = new Date(obj.scheduledAt);
  }
  return obj;
}

// Singleton database connection
let db: TimelineDB | null = null;

// Get database connection
export function getDb(): TimelineDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB cannot be accessed server-side.");
  }

  if (!db) {
    db = new TimelineDB();

    // db.version(DB_VERSION + 1).upgrade((tx) => {
    //   tx.table(TASKS_STORE)
    //     .toCollection()
    //     .modify((task) => {
    //       task.createdAt = new Date();
    //       task.scheduledAt = null;
    //     });
    // });

    // Add error handling
    db.on("blocked", () =>
      console.warn("IndexedDB upgrade blocked by another connection")
    );

    db.on("versionchange", () => {
      console.warn("Database version changed in another connection");
      if (db) db.close();
      db = null;
    });
  }

  return db;
}

// Generic CRUD operations

// Add item to a store
export async function addItem<T extends BaseRecord>(
  storeName: StoreName,
  item: Omit<T, "id"> & { createdAt?: Date }
): Promise<number> {
  const db = getDb();
  const itemToAdd = {
    ...item,
    createdAt: item.createdAt || new Date(),
  } as T;

  const id = await db.table(storeName).add(itemToAdd);
  console.log(`Item added to ${storeName}, ID:`, id);
  return id as number;
}

// Get all items from a store
export async function getAllItems<T extends BaseRecord>(
  storeName: StoreName
): Promise<T[]> {
  const db = getDb();
  const items = await db.table(storeName).toArray();
  return items as T[];
}

// Get item by ID
export async function getItemById<T extends BaseRecord>(
  storeName: StoreName,
  id: number
): Promise<T | null> {
  const db = getDb();
  const item = await db.table(storeName).get(id);
  return item as T | null;
}

// Update item
export async function updateItem<T extends BaseRecord>(
  storeName: StoreName,
  item: T
): Promise<void> {
  if (!item.id) {
    throw new Error(`Cannot update item in ${storeName} without ID`);
  }

  const db = getDb();
  await db.table(storeName).put(item);
  console.log(`Item updated in ${storeName}, ID:`, item.id);
}

// Delete item
export async function deleteItem(
  storeName: StoreName,
  itemId: number
): Promise<void> {
  const db = getDb();
  await db.table(storeName).delete(itemId);
  console.log(`Item deleted from ${storeName}, ID:`, itemId);
}

// Delete multiple items
export async function deleteItems(
  storeName: StoreName,
  itemIds: number[]
): Promise<void> {
  const db = getDb();
  await db.transaction("rw", db.table(storeName), async () => {
    await Promise.all(itemIds.map((id) => db.table(storeName).delete(id)));
  });
  console.log(`${itemIds.length} items deleted from ${storeName}`);
}

// Query by index
export async function getItemsByIndex<T extends BaseRecord>(
  storeName: StoreName,
  indexName: string,
  value: any
): Promise<T[]> {
  const db = getDb();
  const items = await db
    .table(storeName)
    .where(indexName)
    .equals(value)
    .toArray();
  return items as T[];
}
