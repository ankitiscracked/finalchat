<template>
  <div :tabindex="0" :class="[{ today: isToday }]" @keydown.prevent="onKeyDown">
    <div class="day-header">
      <span class="text-sm font-semibold">{{ formattedDay }}</span>
      <span class="text-xs font-semibold text-gray-400">{{
        formattedDate
      }}</span>
    </div>
    <div class="tasks-container">
      <div v-if="tasks.length === 0" class="empty-tasks">
        No tasks for this day
      </div>
      <div v-else class="tasks-scroll">
        <WeekTaskItem
          v-for="(task, index) in tasks"
          :key="task.id"
          :task="task"
          :index="index"
          :is-focused="task.id === focusedTaskId"
          @focus="$emit('focus-task', task.id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TaskRecord } from "../../services/indexedDB";
import WeekTaskItem from "./WeekTaskItem.vue";
import dayjs from "dayjs";

const { itemRefs } = useWeekTasks();

function onKeyDown(e: KeyboardEvent) {
  if (e.key === "ArrowUp") {
    const prevWeekday = dayjs(props.date).subtract(1, "day");
    const prevWeekdayName = prevWeekday.format("dddd").toLowerCase();
    itemRefs.value.get(prevWeekdayName)?.at(0)?.focus();
  } else if (e.key === "ArrowDown") {
    const nextWeekday = dayjs(props.date).add(1, "day");
    const nextWeekdayName = nextWeekday.format("dddd").toLowerCase();
    itemRefs.value.get(nextWeekdayName)?.at(0)?.focus();
  }
}

const props = defineProps<{
  date: Date;
  tasks: TaskRecord[];
  focusedTaskId: number | null;
}>();

// Check if a date is today
const isToday = computed(() => {
  return dayjs(props.date).isSame(dayjs(), "day");
});

const formattedDay = computed(() => {
  return props.date.toLocaleDateString("en-US", { weekday: "long" });
});

const formattedDate = computed(() => {
  return props.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
});
</script>

<style lang="scss" scoped>
.day-row {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: $white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &.today {
    border-left: 4px solid $orange-500;
    background-color: $orange-100;
  }
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  .day-name {
    font-weight: 600;
    font-size: 1rem;
    color: $gray-900;
  }

  .day-date {
    font-size: 0.9rem;
    color: $gray-600;
  }
}

.tasks-container {
  width: 100%;
}

.tasks-scroll {
  display: flex;
  overflow-x: auto;
  padding-bottom: 10px;
  gap: 12px;

  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: $gray-100;
  }

  &::-webkit-scrollbar-thumb {
    background-color: $gray-300;
    border-radius: 4px;
  }
}

.empty-tasks {
  padding: 12px;
  text-align: center;
  color: $gray-500;
  font-style: italic;
  font-size: 0.9rem;
}
</style>
