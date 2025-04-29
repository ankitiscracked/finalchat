import {
  addItem,
  deleteItem,
  deleteItems,
  getAllItems,
  getItemById,
  getItemsByIndex,
  updateItem,
  type EventRecord
} from "./indexedDB";

// Store names
const EVENTS_STORE = "events";

/**
 * Get all events from the database
 */
export async function getAllEvents(): Promise<EventRecord[]> {
  const events = await getAllItems<EventRecord>(EVENTS_STORE);
  // Sort by creation time, newest first
  events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return events;
}

/**
 * Get an event by ID
 */
export async function getEventById(id: number): Promise<EventRecord | null> {
  return await getItemById<EventRecord>(EVENTS_STORE, id);
}

/**
 * Create a new event
 */
export async function createEvent(
  content: string,
  projectId?: number,
  collectionId?: number,
  eventDate?: Date
): Promise<EventRecord> {
  const event: Omit<EventRecord, "id"> = {
    type: "event",
    content,
    createdAt: new Date(),
    projectId,
    collectionId,
    eventDate
  };
  
  const id = await addItem<EventRecord>(EVENTS_STORE, event);
  return { ...event, id };
}

/**
 * Update an event
 */
export async function updateEvent(
  id: number,
  updates: Partial<Omit<EventRecord, "id" | "type">>
): Promise<EventRecord> {
  const event = await getEventById(id);
  if (!event) {
    throw new Error(`Event with id ${id} not found`);
  }
  
  const updatedEvent: EventRecord = { ...event, ...updates };
  await updateItem<EventRecord>(EVENTS_STORE, updatedEvent);
  return updatedEvent;
}

/**
 * Delete an event
 */
export async function deleteEvent(id: number): Promise<void> {
  await deleteItem(EVENTS_STORE, id);
}

/**
 * Delete multiple events
 */
export async function deleteMultipleEvents(ids: number[]): Promise<void> {
  await deleteItems(EVENTS_STORE, ids);
}

/**
 * Get events by project
 */
export async function getEventsByProject(projectId: number): Promise<EventRecord[]> {
  const events = await getItemsByIndex<EventRecord>(EVENTS_STORE, "projectId", projectId);
  // Sort by event date if available, otherwise by creation time
  events.sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return a.eventDate.getTime() - b.eventDate.getTime();
    } else if (a.eventDate) {
      return -1;
    } else if (b.eventDate) {
      return 1;
    } else {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
  return events;
}

/**
 * Get events by collection
 */
export async function getEventsByCollection(collectionId: number): Promise<EventRecord[]> {
  const events = await getItemsByIndex<EventRecord>(EVENTS_STORE, "collectionId", collectionId);
  // Sort by event date if available, otherwise by creation time
  events.sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return a.eventDate.getTime() - b.eventDate.getTime();
    } else if (a.eventDate) {
      return -1;
    } else if (b.eventDate) {
      return 1;
    } else {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });
  return events;
}

/**
 * Get events by date range
 */
export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<EventRecord[]> {
  const allEvents = await getAllEvents();
  return allEvents.filter(event => {
    if (!event.eventDate) return false;
    return event.eventDate >= startDate && event.eventDate <= endDate;
  });
}