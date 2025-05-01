import { ref, computed, onMounted } from "vue";
import * as eventService from "../services/eventService";
import type { EventRecord } from "../services/indexedDB";

/**
 * Composable for working with events
 */
export function useEvents() {
  // Reactive state
  const events = useState<EventRecord[]>(() => []);
  const isLoading = ref(false);
  const isInitialized = ref(false);

  /**
   * Initialize events data
   */
  const initialize = async () => {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      events.value = await eventService.getAllEvents();
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to initialize events:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize on component mount
  onMounted(initialize);

  /**
   * Get events for a specific project
   */
  const getByProject = (projectId: number) => {
    return computed(() =>
      events.value.filter((event) => event.projectId === projectId)
    );
  };

  /**
   * Get events for a specific collection
   */
  const getByCollection = (collectionId: number) => {
    return computed(() =>
      events.value.filter((event) => event.collectionId === collectionId)
    );
  };

  /**
   * Get events in a date range
   */
  const getByDateRange = (startDate: Date, endDate: Date) => {
    return computed(() =>
      events.value.filter((event) => {
        if (!event.eventDate) return false;
        return event.eventDate >= startDate && event.eventDate <= endDate;
      })
    );
  };

  /**
   * Create a new event
   */
  const createEvent = async (
    content: string,
    projectId?: number,
    collectionId?: number,
    eventDate?: Date
  ) => {
    isLoading.value = true;
    try {
      const newEvent = await eventService.createEvent(
        content,
        projectId,
        collectionId,
        eventDate
      );
      events.value = [newEvent, ...events.value];
      return newEvent;
    } catch (error) {
      console.error("Failed to create event:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update an event
   */
  const updateEvent = async (
    id: number,
    updates: Partial<Omit<EventRecord, "id" | "type">>
  ) => {
    isLoading.value = true;
    try {
      const updatedEvent = await eventService.updateEvent(id, updates);
      const index = events.value.findIndex((event) => event.id === id);
      if (index !== -1) {
        const updatedEvents = [...events.value];
        updatedEvents[index] = updatedEvent;
        events.value = updatedEvents;
      }
      return updatedEvent;
    } catch (error) {
      console.error(`Failed to update event ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete an event
   */
  const deleteEvent = async (id: number) => {
    isLoading.value = true;
    try {
      await eventService.deleteEvent(id);
      events.value = events.value.filter((event) => event.id !== id);
    } catch (error) {
      console.error(`Failed to delete event ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete multiple events
   */
  const deleteMultiple = async (ids: number[]) => {
    isLoading.value = true;
    try {
      await eventService.deleteMultipleEvents(ids);
      events.value = events.value.filter(
        (event) => !ids.includes(event.id as number)
      );
    } catch (error) {
      console.error("Failed to delete events:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Refresh events data from the database
   */
  const refreshEvents = async () => {
    isLoading.value = true;
    try {
      events.value = await eventService.getAllEvents();
    } catch (error) {
      console.error("Failed to refresh events:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    events,
    isLoading,
    isInitialized,
    getByProject,
    getByCollection,
    getByDateRange,
    createEvent,
    updateEvent,
    deleteEvent,
    deleteMultiple,
    refreshEvents,
    initialize,
  };
}
