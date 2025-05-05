<template>
  <TaskItemWithActions
    :task="props.task"
    v-model:is-task-edit-popover-open="isTaskEditPopoverOpen"
    v-model:is-task-status-popover-open="isTaskStatusPopoverOpen"
  >
    <div
      :tabindex="0"
      :ref="(el) => setTaskItemRef(task, el)"
      class="p-4 focus:bg-gray-100 rounded-sm border-gray-200 outline-none border min-w-[200px] max-w-[300px]"
      @click.prevent="
        () => {
          isTaskEditPopoverOpen = false;
          isTaskStatusPopoverOpen = false;
          isDeleteModalOpen = false;
        }
      "
      @keydown.stop.prevent="onKeyDown"
    >
      <div class="task-time">{{ formattedTime }}</div>
      <div class="task-content">{{ task.content }}</div>
      <div class="task-status" :class="`status-${task.status}`">
        {{ formatStatus(task.status) }}
      </div>
      <div v-if="projectName" class="task-project">#{{ projectName }}</div>
    </div>
  </TaskItemWithActions>

  <UModal v-model:open="isDeleteModalOpen">
    <template #content>
      <div class="p-4 rounded-sm">
        <span>Should we delete this task?</span>
        <div class="flex justify-end gap-4">
          <button
            class="px-2 py-1 outline-gray-400 outline-offset-2 rounded-sm"
            @click.prevent="isDeleteModalOpen = false"
          >
            Close
          </button>
          <button
            @click="
              () => {
                deleteTask(props.task.id!);
                isDeleteModalOpen = false;
              }
            "
            class="bg-gray-800 px-2 py-1 text-white rounded-sm outline-offset-2 outline-gray-400"
          >
            Delete
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type { TaskRecord } from "../../services/indexedDB";
import { getProjectName } from "../../services/projectService";
import TaskItemWithActions from "../TaskItemWithActions.vue";

const props = defineProps<{
  task: TaskRecord;
  isFocused: boolean;
  index: number;
}>();

const { projects } = useProjects("");
const { setItemRef, itemRefs } = useWeekTasks();
const { deleteTask } = useTasks();

const isTaskStatusPopoverOpen = ref(false);
const isTaskEditPopoverOpen = ref(false);
const isDeleteModalOpen = ref(false);

const weeekday = computed(() => {
  return dayjs(props.task.createdAt).format("dddd").toLowerCase();
});

function onKeyDown(e: KeyboardEvent) {
  console.log("Key pressed:", e.key);
  if (e.key === "ArrowLeft") {
    const prevIndex = props.index - 1;
    itemRefs.value.get(weeekday.value)?.at(prevIndex)?.focus();
  } else if (e.key === "ArrowRight") {
    const nextIndex = props.index + 1;
    itemRefs.value.get(weeekday.value)?.at(nextIndex)?.focus();
  } else if (e.key === "ArrowUp") {
    const prevWeekday = dayjs(props.task.createdAt).subtract(1, "day");
    const prevWeekdayName = prevWeekday.format("dddd").toLowerCase();
    itemRefs.value.get(prevWeekdayName)?.at(props.index)?.focus();
  } else if (e.key === "ArrowDown") {
    const nextWeekday = dayjs(props.task.createdAt).add(1, "day");
    const nextWeekdayName = nextWeekday.format("dddd").toLowerCase();
    itemRefs.value.get(nextWeekdayName)?.at(props.index)?.focus();
  } else if (e.key === "Escape") {
    // Handle escape key
  } else if (e.key === "Enter") {
    // Handle enter key
  } else if (e.key === "s") {
    isTaskStatusPopoverOpen.value = true;
  } else if (e.key === "e") {
    isTaskEditPopoverOpen.value = true;
  } else if (e.key === "d") {
    console.log("Delete task");
    isDeleteModalOpen.value = true;
  }
}

function setTaskItemRef(task: TaskRecord, ref: HTMLElement) {
  const weekday = dayjs(task.createdAt).format("dddd").toLowerCase();
  setItemRef(ref, weekday, props.index);
}

const formattedTime = computed(() => {
  return props.task.createdAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

const projectName = computed(() => {
  if (!props.task.projectId) return null;
  return getProjectName(projects.value, props.task.projectId);
});

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

<style lang="scss" scoped>
.task-item {
  flex: 0 0 auto;
  min-width: 200px;
  max-width: 300px;
  background-color: $white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid $gray-200;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  // &.focused {
  //   border: 2px solid $orange-500;
  //   box-shadow: 0 0 0 2px rgba($orange-500, 0.2);
  // }
}

.task-time {
  font-size: 0.8rem;
  color: $gray-500;
}

.task-content {
  font-size: 0.95rem;
  color: $gray-900;
  word-break: break-word;
}

.task-status {
  font-size: 0.8rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;

  &.status-todo {
    background-color: $gray-100;
    color: $gray-700;
  }

  &.status-in-progress {
    background-color: $orange-100;
    color: $orange-700;
  }

  &.status-done {
    background-color: $gray-100;
    color: $gray-900;
  }
}

.task-project {
  font-size: 0.8rem;
  color: $orange-700;
  background-color: $orange-100;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}
</style>
