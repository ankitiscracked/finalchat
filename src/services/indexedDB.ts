const DB_NAME = 'TimelineAppDB';
const STORE_NAME = 'timelineItems';
const DB_VERSION = 1; // Increment this if schema changes

// Define the structure of our timeline items in IndexedDB
export interface TimelineItemRecord {
    id?: number; // Auto-incrementing primary key
    type: 'task' | 'spend' | 'event' | 'default';
    content: string;
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
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    console.log(`Creating object store: ${STORE_NAME}`);
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                    // Potential place to add indexes if needed later, e.g., on 'createdAt'
                    // store.createIndex('createdAt', 'createdAt', { unique: false });
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
