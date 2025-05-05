import { ref, computed } from "vue";
import type { TaskRecord } from "../services/indexedDB";
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";

// Initialize dayjs plugins
dayjs.extend(weekday);

export function useWeekTasks() {
  const { tasks } = useTasks();

  // Show state for week view
  const showWeekTasks = useState(() => false);
  const focusedTaskId = ref<number | null>(null);
  const focusedDayIndex = ref<number | null>(null);

  const itemRefs = useState<Map<string, HTMLElement[]>>(
    "weekTasksItemRefs",
    () => new Map()
  );

  const setItemRef = (el: HTMLElement, weekday: string, index: number) => {
    const refs = itemRefs.value.get(weekday) || [];
    refs[index] = el;
    itemRefs.value.set(weekday, refs);
  };

  // Get dates for the current week (Monday to Sunday)
  const weekDays = computed(() => {
    const today = dayjs();
    const firstDayOfWeek = today.weekday(0); // Get Monday of current week (0 = Monday in weekday plugin)

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = firstDayOfWeek.add(i, "day");
      days.push({
        date: date.toDate(),
        name: date.format("ddd").toLowerCase(), // Short weekday name
        fullName: date.format("dddd").toLowerCase(), // Full weekday name
      });
    }

    return days;
  });

  // Get index of today in the week
  const todayIndex = computed(() => {
    const today = dayjs();
    return weekDays.value.findIndex((day) =>
      dayjs(day.date).isSame(today, "day")
    );
  });

  // Get tasks for a specific date
  function getTasksForDate(date: Date): TaskRecord[] {
    const targetDate = dayjs(date);
    return tasks.value.filter((task) => {
      const taskDate = dayjs(task.createdAt);
      return taskDate.isSame(targetDate, "day");
    });
  }

  // Focus on a specific day and its t-2 task if available
  function focusDay(dayIndex: number) {
    if (dayIndex < 0 || dayIndex > 6) {
      console.error("Invalid day index:", dayIndex);
      return;
    }

    focusedDayIndex.value = dayIndex;
    const date = weekDays.value[dayIndex].date;
    const dayTasks = getTasksForDate(date);

    if (dayTasks.length >= 2) {
      // Focus on the second task from the end (t-2)
      const focusIndex = dayTasks.length - 2;
      focusedTaskId.value = dayTasks[focusIndex].id;
    } else if (dayTasks.length === 1) {
      // If only one task, focus on it
      focusedTaskId.value = dayTasks[0].id;
    } else {
      // No tasks for this day
      focusedTaskId.value = null;
    }
  }

  // Get the day index from weekday name
  function getDayIndexFromName(name: string): number | null {
    const dayNames = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const shortDayNames = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    // Check for full name
    const fullNameIndex = dayNames.findIndex(
      (d) => d.toLowerCase() === name.toLowerCase()
    );
    if (fullNameIndex !== -1) return fullNameIndex;

    // Check for short name
    const shortNameIndex = shortDayNames.findIndex(
      (d) => d.toLowerCase() === name.toLowerCase()
    );
    if (shortNameIndex !== -1) return shortNameIndex;

    return null;
  }

  // Toggle the week tasks view
  function toggleWeekTasksView(show = true) {
    showWeekTasks.value = show;

    if (show) {
      // When opening the view, focus on today's t-2 task
      focusDay(todayIndex.value);
    }
  }

  return {
    showWeekTasks,
    weekDays,
    focusedTaskId,
    focusedDayIndex,
    todayIndex,
    getTasksForDate,
    focusDay,
    getDayIndexFromName,
    toggleWeekTasksView,
    itemRefs,
    setItemRef,
  };
}
