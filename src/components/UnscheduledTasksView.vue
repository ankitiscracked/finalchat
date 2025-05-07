<template>
  <template v-for="(task, idx) in unscheduledTasks" :key="task.id">
    <TaskItem
      :task="task"
      :index="idx"
      :focused="idx === focusedIndex"
      :selected="selectedIndexes.has(idx)"
      :project-name="project"
      :handle-keydown="onKeyDown"
      :set-itemref="setItemRef"
    />
  </template>
</template>

<script setup lang="ts">
const { unscheduledTasks } = useTasks();
const itemCount = computed(() => {
  return unscheduledTasks.value.length;
});
const { focusedIndex, selectedIndexes, setItemRef, onKeyDown } = useListItems(
  itemCount.value
);
const project = ref("");
</script>
