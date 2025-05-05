<template>
  <TaskItemWithActions
    :task="props.task"
    v-model:is-task-edit-popover-open="isTaskEditPopoverOpen"
    v-model:is-task-status-popover-open="isTaskStatusPopoverOpen"
  >
    <div
      :class="[
        'overview-item',
        `item-${task.type}`,
        {
          focused: props.focused,
        },
      ]"
      :tabindex="0"
      @click="
        () => {
          isTaskEditPopoverOpen = false;
          isTaskStatusPopoverOpen = false;
        }
      "
      @keydown.prevent="onKeyDown"
      :ref="(el) => props.setItemref(props.index, el)"
    >
      <div class="checkbox-wrapper">
        <input type="checkbox" :checked="props.selected" />
      </div>
      <span class="item-icon">
        <i :class="iconClass"></i>
      </span>
      <div class="item-content">
        {{ task.content }}

        <!-- Show status for tasks -->
        <span
          v-if="task.type === 'task'"
          class="item-status"
          :class="[`status-${task.status || 'todo'}`]"
        >
          {{ formatStatus(task.status || "todo") }}
        </span>

        <!-- Show project for tasks with projectId -->
        <span
          v-if="task.type === 'task' && task.projectId"
          class="item-project"
        >
          in
          <span class="project-tag">#{{ projectName }}</span>
        </span>

        <span class="item-timestamp">{{ formattedTime }}</span>
      </div>
    </div>
  </TaskItemWithActions>

  <!-- <TaskStatePopover :is-task-popover-open="isTaskPopoverOpen" /> -->
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
  projectName: string;
  handleKeydown: (event: KeyboardEvent) => void;
  setItemref: (index: number, el: HTMLElement) => void;
}>();
const isTaskStatusPopoverOpen = ref(false);
const isTaskEditPopoverOpen = ref(false);

const isPopoverOpen = computed(
  () => isTaskEditPopoverOpen.value || isTaskStatusPopoverOpen.value
);

watch(isPopoverOpen, (newVal) => {
  console.log("Popover state changed:", newVal);
});

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
