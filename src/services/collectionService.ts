import { addItem, getAllItems, getItemById, type CollectionRecord } from './indexedDB';

// Store name constant
const COLLECTIONS_STORE = "collections";

/**
 * Load all collections from the database
 */
export async function loadCollections(): Promise<CollectionRecord[]> {
  return getAllItems<CollectionRecord>(COLLECTIONS_STORE);
}

/**
 * Find a collection by name in the given collection list
 */
export function findCollectionByName(collections: CollectionRecord[], name: string): CollectionRecord | undefined {
  return collections.find(c => c.name.toLowerCase() === name.toLowerCase());
}

/**
 * Create a new collection
 */
export async function createCollection(name: string): Promise<CollectionRecord> {
  // Check collection name validity
  if (!name || name.trim() === "") {
    throw new Error("Collection name cannot be empty");
  }
  
  // Create collection in database
  const newCollection: Omit<CollectionRecord, 'id'> = {
    name: name.trim(),
    createdAt: new Date()
  };
  
  // Add to database
  const id = await addItem<CollectionRecord>(COLLECTIONS_STORE, newCollection);
  
  // Return the complete collection
  return {
    ...newCollection,
    id
  };
}

/**
 * Get a collection by ID
 */
export async function getCollection(id: number): Promise<CollectionRecord | null> {
  return getItemById<CollectionRecord>(COLLECTIONS_STORE, id);
}
