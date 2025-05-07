<template>
  <UPopover
    v-model:open="isPopoverOpen"
    @update:open="
      (val) => {
        isTaskStatusPopoverOpen = val;
        isTaskEditPopoverOpen = val;
        isMoveTaskPopoverOpen = val;
      }
    "
  >
    <slot></slot>

    <template #content>
      <!-- popover to change the status of the focused task -->
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

      <!-- popover to edit the focused task -->
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

      <div v-if="isMoveTaskPopoverOpen">
        <UCommandPalette
          v-model="label"
          placeholder="Move task to..."
          :groups="[{ id: 'labels', items: rescheduleOptions }]"
          @update:model-value="moveTaskTo"
        />
      </div>

      <!-- popover to re-schedule a task to a different date-->
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
const isMoveTaskPopoverOpen = defineModel<boolean>("isMoveTaskPopoverOpen", {
  default: false,
});

const rescheduleOptions = ref([
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Next Week", value: "next-week" },
  { label: "Same day next week", value: "same-day-next-week" },
  { label: "Next month", value: "same-day-next-week" },
  { label: "Same day next month", value: "same-day-next-week" },
]);
const label = ref({});

const isPopoverOpen = computed(
  () =>
    isTaskEditPopoverOpen.value ||
    isTaskStatusPopoverOpen.value ||
    isMoveTaskPopoverOpen.value
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

function moveTaskTo(selectedItem: any) {
  const { label, value } = selectedItem;
  if (value === "today") {
    // Logic to move task to today
  } else if (value === "tomorrow") {
    // Logic to move task to tomorrow
  } else if (value === "next-week") {
    // Logic to move task to next week
  } else if (value === "same-day-next-week") {
    // Logic to move task to the same day next week
  } else if (value === "next-month") {
    // Logic to move task to next month
  } else if (value === "same-day-next-month") {
    // Logic to move task to the same day next month
  }
  isMoveTaskPopoverOpen.value = false;
}
</script>
