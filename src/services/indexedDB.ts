const DB_NAME = 'TimelineAppDB';
const STORE_NAME = 'timelineItems';
const PROJECTS_STORE_NAME = 'projects';
const COLLECTIONS_STORE_NAME = 'collections';
const DB_VERSION = 3; // Incremented for schema changes

// Define the structure of our timeline items in IndexedDB
export interface TimelineItemRecord {
    id?: number; // Auto-incrementing primary key
    type: 'task' | 'spend' | 'event' | 'default';
    content: string;
    createdAt: Date;
    projectId?: number; // Optional reference to a project
    collectionId?: number; // Optional reference to a collection
    status?: 'todo' | 'in-progress' | 'done'; // Status for tasks
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

let dbPromise: Promise<IDBDatabase> | null = null;

function getDbPromise(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error("IndexedDB cannot be accessed server-side."));
    }
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            console.log(`Opening IndexedDB: ${DB_NAME} version ${DB_VERSION}`);
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("IndexedDB error:", request.error);
                reject(new Error(`IndexedDB error: ${request.error}`));
            };

            request.onsuccess = (event) => {
                console.log("IndexedDB opened successfully.");
                resolve(request.result);
            };

            // This event only executes if the version number changes
            request.onupgradeneeded = (event) => {
                console.log("IndexedDB upgrade needed.");
                const db = request.result;
                const oldVersion = event.oldVersion;
                
                // Create timeline items store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    console.log(`Creating object store: ${STORE_NAME}`);
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    // Add indexes if needed
                    // store.createIndex('createdAt', 'createdAt', { unique: false });
                }
                
                // Create projects store if it doesn't exist
                if (!db.objectStoreNames.contains(PROJECTS_STORE_NAME)) {
                    console.log(`Creating object store: ${PROJECTS_STORE_NAME}`);
                    const projectStore = db.createObjectStore(PROJECTS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    // Add index on name for quick lookup
                    projectStore.createIndex('name', 'name', { unique: true });
                }
                
                // Create collections store if it doesn't exist
                if (!db.objectStoreNames.contains(COLLECTIONS_STORE_NAME)) {
                    console.log(`Creating object store: ${COLLECTIONS_STORE_NAME}`);
                    const collectionsStore = db.createObjectStore(COLLECTIONS_STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    // Add index on name for quick lookup
                    collectionsStore.createIndex('name', 'name', { unique: true });
                }
                
                console.log("IndexedDB upgrade complete.");
            };
        });
    }
    return dbPromise;
}

export async function addItem(item: Omit<TimelineItemRecord, 'id' | 'createdAt'> & { createdAt?: Date }): Promise<number> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const itemToAdd: TimelineItemRecord = {
            ...item,
            createdAt: item.createdAt || new Date(), // Ensure createdAt is set
        };
        const request = store.add(itemToAdd);

        request.onsuccess = () => {
            console.log("Item added successfully to IndexedDB, ID:", request.result);
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error("Error adding item to IndexedDB:", request.error);
            reject(new Error(`Error adding item: ${request.error}`));
        };
    });
}

export async function getAllItems(): Promise<TimelineItemRecord[]> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll(); // Gets all items

        request.onsuccess = () => {
            console.log(`Retrieved ${request.result.length} items from IndexedDB.`);
            // Ensure dates are Date objects (IndexedDB might store them differently)
            const items = request.result.map(item => ({
                ...item,
                createdAt: new Date(item.createdAt)
            }));
            // Sort by ID (which reflects insertion order)
            items.sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
            resolve(items);
        };

        request.onerror = () => {
            console.error("Error getting items from IndexedDB:", request.error);
            reject(new Error(`Error getting items: ${request.error}`));
        };
    });
}

export async function updateItem(item: TimelineItemRecord): Promise<void> {
    if (!item.id) {
        throw new Error("Cannot update item without ID");
    }
    
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(item);

        request.onsuccess = () => {
            console.log("Item updated successfully in IndexedDB, ID:", item.id);
            resolve();
        };

        request.onerror = () => {
            console.error("Error updating item in IndexedDB:", request.error);
            reject(new Error(`Error updating item: ${request.error}`));
        };
    });
}

export async function deleteItem(itemId: number): Promise<void> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(itemId);

        request.onsuccess = () => {
            console.log("Item deleted successfully from IndexedDB, ID:", itemId);
            resolve();
        };

        request.onerror = () => {
            console.error("Error deleting item from IndexedDB:", request.error);
            reject(new Error(`Error deleting item: ${request.error}`));
        };
    });
}

// Project functions

export async function addProject(project: Omit<ProjectRecord, 'id'>): Promise<number> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE_NAME);
        const request = store.add(project);

        request.onsuccess = () => {
            console.log("Project added successfully to IndexedDB, ID:", request.result);
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error("Error adding project to IndexedDB:", request.error);
            reject(new Error(`Error adding project: ${request.error}`));
        };
    });
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log(`Retrieved ${request.result.length} projects from IndexedDB.`);
            // Ensure dates are Date objects
            const projects = request.result.map(project => ({
                ...project,
                createdAt: new Date(project.createdAt)
            }));
            // Sort by name alphabetically
            projects.sort((a, b) => a.name.localeCompare(b.name));
            resolve(projects);
        };

        request.onerror = () => {
            console.error("Error getting projects from IndexedDB:", request.error);
            reject(new Error(`Error getting projects: ${request.error}`));
        };
    });
}

export async function getProjectById(id: number): Promise<ProjectRecord | null> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([PROJECTS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            if (request.result) {
                resolve({
                    ...request.result,
                    createdAt: new Date(request.result.createdAt)
                });
            } else {
                resolve(null);
            }
        };

        request.onerror = () => {
            console.error("Error getting project from IndexedDB:", request.error);
            reject(new Error(`Error getting project: ${request.error}`));
        };
    });
}

// Collection functions

export async function addCollection(collection: Omit<CollectionRecord, 'id'>): Promise<number> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([COLLECTIONS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(COLLECTIONS_STORE_NAME);
        const request = store.add(collection);

        request.onsuccess = () => {
            console.log("Collection added successfully to IndexedDB, ID:", request.result);
            resolve(request.result as number);
        };

        request.onerror = () => {
            console.error("Error adding collection to IndexedDB:", request.error);
            reject(new Error(`Error adding collection: ${request.error}`));
        };
    });
}

export async function getAllCollections(): Promise<CollectionRecord[]> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([COLLECTIONS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(COLLECTIONS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log(`Retrieved ${request.result.length} collections from IndexedDB.`);
            // Ensure dates are Date objects
            const collections = request.result.map(collection => ({
                ...collection,
                createdAt: new Date(collection.createdAt)
            }));
            // Sort by name alphabetically
            collections.sort((a, b) => a.name.localeCompare(b.name));
            resolve(collections);
        };

        request.onerror = () => {
            console.error("Error getting collections from IndexedDB:", request.error);
            reject(new Error(`Error getting collections: ${request.error}`));
        };
    });
}

export async function getCollectionById(id: number): Promise<CollectionRecord | null> {
    const db = await getDbPromise();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([COLLECTIONS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(COLLECTIONS_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            if (request.result) {
                resolve({
                    ...request.result,
                    createdAt: new Date(request.result.createdAt)
                });
            } else {
                resolve(null);
            }
        };

        request.onerror = () => {
            console.error("Error getting collection from IndexedDB:", request.error);
            reject(new Error(`Error getting collection: ${request.error}`));
        };
    });
}
