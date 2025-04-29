import {
  addItem,
  deleteItem,
  deleteItems,
  getAllItems,
  getItemById,
  getItemsByIndex,
  updateItem,
  type NoteRecord
} from "./indexedDB";

// Store names
const NOTES_STORE = "notes";

/**
 * Get all notes from the database
 */
export async function getAllNotes(): Promise<NoteRecord[]> {
  const notes = await getAllItems<NoteRecord>(NOTES_STORE);
  // Sort by creation time, newest first
  notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notes;
}

/**
 * Get a note by ID
 */
export async function getNoteById(id: number): Promise<NoteRecord | null> {
  return await getItemById<NoteRecord>(NOTES_STORE, id);
}

/**
 * Create a new note
 */
export async function createNote(
  content: string,
  collectionId?: number
): Promise<NoteRecord> {
  const note: Omit<NoteRecord, "id"> = {
    type: "default",
    content,
    createdAt: new Date(),
    collectionId
  };
  
  const id = await addItem<NoteRecord>(NOTES_STORE, note);
  return { ...note, id };
}

/**
 * Update a note
 */
export async function updateNote(
  id: number,
  updates: Partial<Omit<NoteRecord, "id" | "type">>
): Promise<NoteRecord> {
  const note = await getNoteById(id);
  if (!note) {
    throw new Error(`Note with id ${id} not found`);
  }
  
  const updatedNote: NoteRecord = { ...note, ...updates };
  await updateItem<NoteRecord>(NOTES_STORE, updatedNote);
  return updatedNote;
}

/**
 * Delete a note
 */
export async function deleteNote(id: number): Promise<void> {
  await deleteItem(NOTES_STORE, id);
}

/**
 * Delete multiple notes
 */
export async function deleteMultipleNotes(ids: number[]): Promise<void> {
  await deleteItems(NOTES_STORE, ids);
}

/**
 * Get notes by collection
 */
export async function getNotesByCollection(collectionId: number): Promise<NoteRecord[]> {
  const notes = await getItemsByIndex<NoteRecord>(NOTES_STORE, "collectionId", collectionId);
  // Sort by creation time, newest first
  notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return notes;
}

/**
 * Search notes by content
 */
export async function searchNotes(query: string): Promise<NoteRecord[]> {
  if (!query.trim()) {
    return [];
  }
  
  const allNotes = await getAllNotes();
  const searchTerm = query.toLowerCase();
  
  return allNotes.filter(note => 
    note.content.toLowerCase().includes(searchTerm)
  );
}