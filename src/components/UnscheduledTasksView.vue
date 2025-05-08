<template>
  <div class="border border-gray-300 rounded-sm px-4 py-2 h-full overflow-auto">
    <h3 class="text-md font-semibold">Unscheduled Tasks</h3>
    <div class="mt-4 flex flex-col gap-4">
      <template v-for="(task, idx) in unscheduledTasks" :key="task.id">
        <TaskItem
          :task="task"
          :index="idx"
          :focused="idx === focusedIndex"
          :selected="selectedIndexes.has(idx)"
          :project-name="project"
          :handle-keydown="onKeyDown"
          :set-itemref="setItemRef"
          :on-project-popover-close="() => focusIndexItem(idx)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const { unscheduledTasks } = useTasks();
console.log("Unscheduled Tasks:", unscheduledTasks.value);
const itemCount = computed(() => {
  return unscheduledTasks.value.length;
});
const { focusedIndex, selectedIndexes, setItemRef, onKeyDown, focusIndexItem } =
  useListItems(itemCount.value);
const project = ref("");
</script>
