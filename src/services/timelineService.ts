import { addItem, getAllItems, type TimelineItemRecord } from './indexedDB';

/**
 * Submit a new timeline item to the database
 */
export async function submitTimelineItem(
  type: string, 
  content: string, 
  projectId?: number,
  collectionId?: number,
  dateOffset: number = 0
): Promise<TimelineItemRecord> {
  // Create a date with the offset applied
  const offsetDate = new Date();
  if (dateOffset > 0) {
    offsetDate.setDate(offsetDate.getDate() + dateOffset);
  }
  
  // Create item without ID (it will be auto-generated)
  const newItem: Omit<TimelineItemRecord, "id" | "createdAt"> = {
    type: type as any,
    content: content,
    projectId,
    collectionId
  };
  
  // Add to database
  const id = await addItem({
    ...newItem,
    createdAt: offsetDate
  });
  
  // Return the complete item
  return {
    ...newItem,
    id,
    createdAt: offsetDate
  };
}

/**
 * Load all timeline items from the database
 */
export async function loadTimelineItems(): Promise<TimelineItemRecord[]> {
  const items = await getAllItems();
  return items;
}

/**
 * Group timeline items by date
 */
export function groupItemsByDate(items: TimelineItemRecord[]): [string, TimelineItemRecord[]][] {
  const groups: Record<string, TimelineItemRecord[]> = {};
  
  items.forEach((item) => {
    const dateStr = formatDate(item.createdAt);
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(item);
  });
  
  // Return as an array of [date, items] pairs, sorted chronologically
  return Object.entries(groups).sort((a, b) => {
    // Convert date strings back to Date objects for comparison
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a time for display
 */
export function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get the icon class for a timeline item type
 */
export function getIconClass(type: string): string {
  switch (type) {
    case "task":
      return "ph-bold ph-check-circle";
    case "spend":
      return "ph-bold ph-currency-dollar";
    case "event":
      return "ph-bold ph-calendar";
    case "note":
      return "ph-bold ph-note-pencil";
    default:
      return "ph-bold ph-chat-text";
  }
}