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
    Object.keys(groupedItems).forEach((date) => {
      groupedItems[date].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
    return Object.entries(groupedItems).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  });

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

  const isTimeLineEmpty = computed(() => {
    return (
      tasks.value.length === 0 &&
      events.value.length === 0 &&
      notes.value.length === 0
    );
  });

  return {
    allItemsGroupedByDate,
    refreshTimeline,
    refreshItems,
    isTimeLineEmpty,
    tasks,
    notes,
    events,
  };
}
