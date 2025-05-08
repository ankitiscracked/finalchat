<template>
  <div class="px-8 rounded-sm overflow-y-auto">
    <h2 class="text-sm text-gray-700 font-semibold bg-gray-100 p-2 rounded-sm">
      Tasks for {{ formatWeekRange }}
    </h2>
    <div class="flex flex-col gap-4 mt-4">
      <WeekDayRow
        v-for="(day, index) in weekDays"
        :key="day.date"
        :date="day.date"
        :tasks="tasksForDate(day.date)"
        :focused-task-id="focusedTaskId"
        @focus-task="handleFocusTask"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { ref, computed, onMounted } from "vue";

const { tasks } = useTasks();
const { itemRefs, weekDays } = useWeekTasks();
const focusedTaskId = ref<number | null>(null);

// Format the week range for display
const formatWeekRange = computed(() => {
  const startDate = weekDays.value[0].date;
  const endDate = weekDays.value[6].date;

  const startFormatted = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFormatted = endDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `${startFormatted} - ${endFormatted}`;
});

// Get tasks for a specific date
function tasksForDate(date: Date) {
  return tasks.value.filter((task) =>
    dayjs(task.scheduledAt).isSame(date, "day")
  );
}

// Focus logic
function handleFocusTask(taskId: number) {
  focusedTaskId.value = taskId;
}

// Initialize with focus on the current day's t-2 task
onMounted(() => {
  let today = dayjs().day();
  let weekday = dayjs().weekday(today).format("dddd").toLowerCase();
  let todayRefs = itemRefs.value.get(weekday);

  while (!todayRefs && today > 0) {
    today = today - 1;
    weekday = dayjs().weekday(today).format("dddd").toLowerCase();
    todayRefs = itemRefs.value.get(weekday);
  }
  todayRefs?.at(0)?.focus();
});
</script>

<style lang="scss" scoped>
.week-tasks-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: $gray-100;
  border-radius: 4px;
  overflow-y: auto;
}

.week-title {
  margin-bottom: 20px;
  font-size: 1.2rem;
  font-weight: 600;
  color: $gray-900;
}

.week-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-container {
  width: 100%;
}
</style>
