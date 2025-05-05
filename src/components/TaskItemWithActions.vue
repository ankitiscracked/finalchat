<template>
  <UPopover
    v-model:open="isPopoverOpen"
    @update:open="
      (val) => {
        isTaskStatusPopoverOpen = val;
        isTaskEditPopoverOpen = val;
      }
    "
  >
    <slot></slot>

    <template #content>
      <div
        v-if="isTaskStatusPopoverOpen"
        class="flex flex-col gap-1 p-1 w-[8rem]"
      >
        <template v-for="state in taskStates" :key="state">
          <button
            class="item-status border border-gray-100 outline-none focus:bg-gray-200 rounded-sm text-md"
            :class="[`status-${state}`]"
            @click="updateStatus(props.task.id!, state)"
          >
            {{ formatStatus(state) }}
          </button>
        </template>
      </div>

      <div v-if="isTaskEditPopoverOpen" class="p-2">
        <span class="text-sm font-semibold">Edit task content</span>
        <textarea
          v-model="task.content"
          class="w-full h-24 p-2 border border-gray-300 rounded-md outline-none"
          placeholder="Edit task content..."
          @keydown.enter.prevent="updateContent(props.task.id!, task.content)"
          @keydown.esc.prevent="isTaskEditPopoverOpen = false"
        ></textarea>
      </div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
import type { TimelineItem } from "~/models";

const taskStates = ["todo", "in-progress", "done"];
const props = defineProps<{
  task: TimelineItem;
}>();

const isTaskEditPopoverOpen = defineModel<boolean>("isTaskEditPopoverOpen", {
  default: false,
});
const isTaskStatusPopoverOpen = defineModel<boolean>(
  "isTaskStatusPopoverOpen",
  { default: false }
);

const isPopoverOpen = computed(
  () => isTaskEditPopoverOpen.value || isTaskStatusPopoverOpen.value
);
const { updateTask, refreshTasks } = useTasks();

async function updateStatus(taskId: number, status: string) {
  try {
    await updateTask(taskId, { status: status });
    await refreshTasks();
  } catch (error) {
    console.error("Error updating task status:", error);
  }
  isTaskStatusPopoverOpen.value = false;
}

async function updateContent(taskId: number, content: string) {
  try {
    await updateTask(taskId, { content: content });
    await refreshTasks();
  } catch (error) {
    console.error("Error updating task content:", error);
  }
  isTaskEditPopoverOpen.value = false;
}

function formatStatus(status: string): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "in-progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status;
  }
}
</script>
