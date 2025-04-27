import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = "TimelineAppDB";
const STORE_NAME = "timelineItems";
const PROJECTS_STORE_NAME = "projects";
const COLLECTIONS_STORE_NAME = "collections";
const DB_VERSION = 3; // Incremented for schema changes

// Define the structure of our timeline items in IndexedDB
export interface TimelineItemRecord {
  id?: number; // Auto-incrementing primary key
  type: "task" | "spend" | "event" | "default";
  content: string;
  createdAt: Date;
  projectId?: number; // Optional reference to a project
  collectionId?: number; // Optional reference to a collection
  status?: "todo" | "in-progress" | "done"; // Status for tasks
}

// Define the structure of our projects in IndexedDB
export interface ProjectRecord {
  id?: number; // Auto-incrementing primary key
  name: string;
  createdAt: Date;
}

// Define the structure of our collections in IndexedDB
export interface CollectionRecord {
  id?: number; // Auto-incrementing primary key
  name: string;
  createdAt: Date;
}

// Database schema typing
interface TimelineDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: TimelineItemRecord;
    indexes: {};
  };
  [PROJECTS_STORE_NAME]: {
    key: number;
    value: ProjectRecord;
    indexes: { 'name': string };
  };
  [COLLECTIONS_STORE_NAME]: {
    key: number;
    value: CollectionRecord;
    indexes: { 'name': string };
  };
}

// Singleton database connection
let dbPromise: Promise<IDBPDatabase<TimelineDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TimelineDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB cannot be accessed server-side.")
    );
  }

  if (!dbPromise) {
    dbPromise = openDB<TimelineDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

        // Create timeline items store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.log(`Creating object store: ${STORE_NAME}`);
          db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
        }

        // Create projects store if it doesn't exist
        if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
          console.log(`Creating object store: ${PROJECTS_STORE_NAME}`);
          const projectStore = db.createObjectStore(PROJECTS_STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          // Add index on name for quick lookup
          projectStore.createIndex("name", "name", { unique: true });
        }

        // Create collections store if it doesn't exist
        if (!db.objectStoreNames.contains(COLLECTIONS_STORE_NAME)) {
          console.log(`Creating object store: ${COLLECTIONS_STORE_NAME}`);
          const collectionsStore = db.createObjectStore(
            COLLECTIONS_STORE_NAME,
            { keyPath: "id", autoIncrement: true }
          );
          // Add index on name for quick lookup
          collectionsStore.createIndex("name", "name", { unique: true });
        }

        console.log("IndexedDB upgrade complete.");
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

export async function addItem(
  item: Omit<TimelineItemRecord, "id" | "createdAt"> & { createdAt?: Date }
): Promise<number> {
  const db = await getDb();
  const itemToAdd: TimelineItemRecord = {
    ...item,
    createdAt: item.createdAt || new Date(),
  };
  
  const id = await db.add(STORE_NAME, itemToAdd);
  console.log("Item added successfully to IndexedDB, ID:", id);
  return id;
}

export async function getAllItems(): Promise<TimelineItemRecord[]> {
  const db = await getDb();
  const items = await db.getAll(STORE_NAME);
  
  console.log(`Retrieved ${items.length} items from IndexedDB.`);
  
  // Ensure dates are Date objects
  const processedItems = items.map((item) => ({
    ...item,
    createdAt: new Date(item.createdAt),
  }));
  
  // Sort by creation time, newest first
  processedItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return processedItems;
}

export async function updateItem(item: TimelineItemRecord): Promise<void> {
  if (!item.id) {
    throw new Error("Cannot update item without ID");
  }

  const db = await getDb();
  await db.put(STORE_NAME, item);
  console.log("Item updated successfully in IndexedDB, ID:", item.id);
}

export async function deleteItem(itemId: number): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, itemId);
  console.log("Item deleted successfully from IndexedDB, ID:", itemId);
}

export async function deleteItems(itemIds: number[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  
  await Promise.all([
    ...itemIds.map(id => tx.store.delete(id)),
    tx.done
  ]);
  
  console.log("All items deleted successfully from IndexedDB.");
}

// Project functions

export async function addProject(
  project: Omit<ProjectRecord, "id">
): Promise<number> {
  const db = await getDb();
  const id = await db.add(PROJECTS_STORE_NAME, project);
  console.log("Project added successfully to IndexedDB, ID:", id);
  return id;
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  const db = await getDb();
  const projects = await db.getAll(PROJECTS_STORE_NAME);
  
  console.log(`Retrieved ${projects.length} projects from IndexedDB.`);
  
  // Ensure dates are Date objects
  const processedProjects = projects.map((project) => ({
    ...project,
    createdAt: new Date(project.createdAt),
  }));
  
  // Sort by name alphabetically
  processedProjects.sort((a, b) => a.name.localeCompare(b.name));
  return processedProjects;
}

export async function getProjectById(
  id: number
): Promise<ProjectRecord | null> {
  const db = await getDb();
  const project = await db.get(PROJECTS_STORE_NAME, id);
  
  if (!project) return null;
  
  return {
    ...project,
    createdAt: new Date(project.createdAt),
  };
}

// Collection functions

export async function addCollection(
  collection: Omit<CollectionRecord, "id">
): Promise<number> {
  const db = await getDb();
  const id = await db.add(COLLECTIONS_STORE_NAME, collection);
  console.log("Collection added successfully to IndexedDB, ID:", id);
  return id;
}

export async function getAllCollections(): Promise<CollectionRecord[]> {
  const db = await getDb();
  const collections = await db.getAll(COLLECTIONS_STORE_NAME);
  
  console.log(`Retrieved ${collections.length} collections from IndexedDB.`);
  
  // Ensure dates are Date objects
  const processedCollections = collections.map((collection) => ({
    ...collection,
    createdAt: new Date(collection.createdAt),
  }));
  
  // Sort by name alphabetically
  processedCollections.sort((a, b) => a.name.localeCompare(b.name));
  return processedCollections;
}

export async function getCollectionById(
  id: number
): Promise<CollectionRecord | null> {
  const db = await getDb();
  const collection = await db.get(COLLECTIONS_STORE_NAME, id);
  
  if (!collection) return null;
  
  return {
    ...collection,
    createdAt: new Date(collection.createdAt),
  };
}