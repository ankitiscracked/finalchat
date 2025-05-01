import { ref, computed, onMounted } from "vue";
import * as noteService from "../services/noteService";
import type { NoteRecord } from "../services/indexedDB";

/**
 * Composable for working with notes
 */
export function useNotes() {
  // Reactive state
  const notes = useState<NoteRecord[]>(() => []);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  /**
   * Initialize notes data
   */
  const initialize = async () => {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      notes.value = await noteService.getAllNotes();
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to initialize notes:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize on component mount
  onMounted(initialize);

  /**
   * Get notes for a specific collection
   */
  const getByCollection = (collectionId: number) => {
    return computed(() =>
      notes.value.filter((note) => note.collectionId === collectionId)
    );
  };

  /**
   * Search notes by content
   */
  const searchNotes = (query: string) => {
    if (!query.trim()) return computed(() => []);

    const searchTerm = query.toLowerCase();
    return computed(() =>
      notes.value.filter((note) =>
        note.content.toLowerCase().includes(searchTerm)
      )
    );
  };

  /**
   * Create a new note
   */
  const createNote = async (content: string, collectionId?: number) => {
    isLoading.value = true;
    try {
      const newNote = await noteService.createNote(content, collectionId);
      notes.value = [newNote, ...notes.value];
      return newNote;
    } catch (error) {
      console.error("Failed to create note:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update a note
   */
  const updateNote = async (
    id: number,
    updates: Partial<Omit<NoteRecord, "id" | "type">>
  ) => {
    isLoading.value = true;
    try {
      const updatedNote = await noteService.updateNote(id, updates);
      const index = notes.value.findIndex((note) => note.id === id);
      if (index !== -1) {
        const updatedNotes = [...notes.value];
        updatedNotes[index] = updatedNote;
        notes.value = updatedNotes;
      }
      return updatedNote;
    } catch (error) {
      console.error(`Failed to update note ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete a note
   */
  const deleteNote = async (id: number) => {
    isLoading.value = true;
    try {
      await noteService.deleteNote(id);
      notes.value = notes.value.filter((note) => note.id !== id);
    } catch (error) {
      console.error(`Failed to delete note ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete multiple notes
   */
  const deleteMultiple = async (ids: number[]) => {
    isLoading.value = true;
    try {
      await noteService.deleteMultipleNotes(ids);
      notes.value = notes.value.filter(
        (note) => !ids.includes(note.id as number)
      );
    } catch (error) {
      console.error("Failed to delete notes:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Refresh notes data from the database
   */
  const refreshNotes = async () => {
    isLoading.value = true;
    try {
      notes.value = await noteService.getAllNotes();
    } catch (error) {
      console.error("Failed to refresh notes:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    notes,
    isLoading,
    isInitialized,
    getByCollection,
    searchNotes,
    createNote,
    updateNote,
    deleteNote,
    deleteMultiple,
    refreshNotes,
    initialize,
  };
}
