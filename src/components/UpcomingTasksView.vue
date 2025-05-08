<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-md font-semibold">Upcoming Tasks</h3>
    <ListItems :items="allTasks" />
  </div>
</template>
<script setup lang="ts">
import dayjs from "dayjs";
import type { TimelineItem } from "~/models";

const { tasks } = useTasks();

const todayTasks = computed(() => {
  return tasks.value.filter((task) => {
    return dayjs(task.scheduledAt).isSame(dayjs(), "day");
  });
});

const tomorrowTasks = computed(() => {
  return tasks.value.filter((task) => {
    return dayjs(task.scheduledAt).isSame(dayjs().add(1, "day"), "day");
  });
});

// group all tasks that are not today or tomorrow by date
const upcomingTasks = computed(() => {
  return tasks.value
    .filter((task) => {
      return (
        !dayjs(task.scheduledAt).isSame(dayjs(), "day") &&
        !dayjs(task.scheduledAt).isSame(dayjs().add(1, "day"), "day")
      );
    })
    .reduce((grouped, task) => {
      const date = dayjs(task.scheduledAt).format("DD-MM-YYYY");
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(task);
      return grouped;
    }, {} as Record<string, TimelineItem[]>);
});

const allTasks = computed(() => {
  return {
    Today: todayTasks.value,
    Tomorrow: tomorrowTasks.value,
    ...upcomingTasks.value,
  };
});
</script>
