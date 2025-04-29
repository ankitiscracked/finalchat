import { type TimelineItem } from "../models";

/**
 * Composable for working with the timeline data
 */
export function useTimeline() {
  const { tasks, refreshTasks } = useTasks();
  const { events, refreshEvents } = useEvents();
  const { notes, refreshNotes } = useNotes();

  const allItemsGroupedByDate = computed(() => {
    const allItems = [...tasks.value, ...events.value, ...notes.value];
    const groupedItems: Record<string, TimelineItem[]> = {};
    allItems.forEach((item) => {
      const date = formatDate(item.createdAt);
      if (!groupedItems[date]) {
        groupedItems[date] = [];
      }
      groupedItems[date].push(item);
    });
    return Object.entries(groupedItems).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  });

  const getItemsByType = (type: string) => {
    return computed(() => {
      switch (type) {
        case "tasks":
          return tasks.value;
        case "events":
          return events.value;
        case "notes":
          return notes.value;
        default:
          console.error("Unknown type:", type);
          return [];
      }
    });
  };

  async function refreshTimeline() {
    await Promise.all([refreshTasks(), refreshEvents(), refreshNotes()]);
  }

  async function refreshItems(type: string) {
    switch (type) {
      case "tasks":
        await refreshTasks();
        break;
      case "events":
        await refreshEvents();
        break;
      case "notes":
        await refreshNotes();
        break;
      default:
        console.error("Unknown type:", type);
    }
  }

  return {
    allItemsGroupedByDate,
    getItemsByType,
    refreshTimeline,
    refreshItems,
  };
}
