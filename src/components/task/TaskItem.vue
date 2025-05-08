<template>
  <TaskItemWithActions
    :task="props.task"
    v-model:is-task-edit-popover-open="isTaskEditPopoverOpen"
    v-model:is-task-status-popover-open="isTaskStatusPopoverOpen"
    v-model:is-move-task-popover-open="isMoveTaskPopoverOpen"
    v-model:is-project-popover-open="showProjectPopover"
  >
    <div
      class="outline-none border-[1.4px] border-stone-200 flex gap-2 items-start py-2 px-4 rounded-sm focus:bg-stone-100"
      :tabindex="0"
      @click.prevent="
        () => {
          isTaskEditPopoverOpen = false;
          isTaskStatusPopoverOpen = false;
          isDeleteModalOpen = false;
          isMoveTaskPopoverOpen = false;
          showProjectPopover = false;
        }
      "
      @keydown.prevent="onKeyDown"
      :ref="(el) => props.setItemref(props.index, el)"
    >
      <div class="flex gap-3">
        <input type="checkbox" :checked="props.selected" />
        <UIcon name="i-ph-check-circle-bold" size="18" class="text-stone-500" />
      </div>

      <div class="flex flex-col gap-1 ml-1">
        <span class="text-sm">{{ task.content }}</span>

        <!-- Show status for tasks -->
        <span class="text-xs" :class="[`status-${task.status || 'todo'}`]">
          {{ formatStatus(task.status || "todo") }}
        </span>

        <!-- Show project for tasks with projectId -->
        <span class="text-xs text-stone-500" v-if="projectName">
          in
          <span class="border rounded-sm py-0.5 px-1 border-stone-300">{{
            projectName
          }}</span>
        </span>

        <span class="text-xs font-normal text-stone-400">{{
          formattedTime
        }}</span>
      </div>
    </div>
  </TaskItemWithActions>

  <DeleteTaskModel
    v-model:is-delete-modal-open="isDeleteModalOpen"
    :task="props.task"
  />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { TimelineItem } from "~/models";
import TaskItemWithActions from "../TaskItemWithActions.vue";

// Props definition
const props = defineProps<{
  task: TimelineItem;
  index: number;
  focused: boolean;
  selected: boolean;
  handleKeydown: (event: KeyboardEvent) => void;
  setItemref: (index: number, el: HTMLElement) => void;
  onProjectPopoverClose: () => void;
}>();
const isTaskStatusPopoverOpen = ref(false);
const isTaskEditPopoverOpen = ref(false);
const isMoveTaskPopoverOpen = ref(false);
const isDeleteModalOpen = ref(false);
const showProjectPopover = ref(false);
const { getProjectName } = useProjects("");

// Compute icon class based on task type
const iconClass = computed(() => {
  switch (props.task.type) {
    case "task":
      return "ph-bold ph-check-circle";
    case "event":
      return "ph-bold ph-calendar";
    case "note":
      return "ph-bold ph-note-pencil";
    default:
      return "ph-bold ph-chat-text";
  }
});

const projectName = computed(() => {
  const task = props.task as TaskRecord;
  return task.projectId ? getProjectName(task.projectId) : "";
});

// Format task status
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

// Format time
const formattedTime = computed(() => {
  if (!props.task.createdAt) return "";
  return props.task.createdAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
});

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "s") {
    isTaskStatusPopoverOpen.value = true;
  } else if (event.key === "e") {
    isTaskEditPopoverOpen.value = true;
  } else if (event.key === "d") {
    isDeleteModalOpen.value = true;
  } else if (event.key === "m") {
    isMoveTaskPopoverOpen.value = true;
  } else if (event.key === "p") {
    showProjectPopover.value = true;
  } else {
    props.handleKeydown(event);
  }
}
</script>

<style lang="scss" scoped>
// Overview colors
$border-color: $gray-300;
$text-color: $gray-900;

.overview-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: $gray-100;

  .checkbox-wrapper {
    margin-right: 12px;
  }

  .item-icon {
    margin-right: 12px;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .item-content {
    flex-grow: 1;
    color: $text-color;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
  }

  .item-project {
    font-size: 0.8rem;
    color: $gray-600;
    margin-top: 4px;
    display: block;
  }

  .item-project .project-tag {
    background-color: rgba($orange-200, 0.7);
    padding: 2px 6px;
    border-radius: 4px;
    color: $orange-700;
    font-size: 12px;
    font-weight: 500;
  }

  .item-timestamp {
    font-size: 12px;
    color: $gray-500;
    margin-top: 5px;
    display: block;
  }

  // Task status styles
  .item-status {
    display: inline-block;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;
    margin-left: 8px;

    &.status-todo {
      background-color: rgba($gray-300, 0.6);
      color: $gray-700;
    }

    &.status-in-progress {
      background-color: rgba($orange-200, 0.6);
      color: $orange-700;
    }

    &.status-done {
      background-color: rgba($gray-100, 0.6);
      color: $gray-600;
      text-decoration: line-through;
    }
  }

  // Focus styles
  &.focused {
    background-color: rgba($orange-100, 0.5);
    outline: 2px solid $orange-400;
  }

  // Type-specific styles
  &.item-task {
    .item-icon {
      color: $orange-500;
    }
    cursor: pointer;
    outline: none;
    transition: background-color 0.2s ease;

    &:focus {
      background-color: rgba($orange-100, 0.5);
      outline: 2px solid $orange-400;
    }
  }
}
</style>
