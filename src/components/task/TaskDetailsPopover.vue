<template>
  <div class="task-details-popover reka-popover" :style="positionStyle">
    <div class="popover-header">
      <h3>Task Details</h3>
      <button @click="$emit('close')" class="close-button">
        <i class="ph-bold ph-x"></i>
      </button>
    </div>
    <div class="popover-content">
      <div class="task-content">
        {{ task.content }}
      </div>
      <div class="task-meta">
        <div
          class="task-status reka-badge"
          :class="[`status-${task.status || 'todo'}`]"
        >
          {{ formatStatus(task.status || "todo") }}
        </div>

        <div v-if="task.projectId" class="task-project">
          in
          <span class="project-tag reka-tag"
            >#{{ getProjectName(task.projectId) }}</span
          >
        </div>

        <div class="task-date">
          Created: {{ formatDateTime(task.createdAt) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TimelineItemRecord } from "../../services/indexedDB";

const props = defineProps<{
  position: { top: number; left: number };
  task: TimelineItemRecord;
  projects: any[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

// Computed style for positioning the popover
const positionStyle = computed(() => {
  return {
    top: `${props.position.top}px`,
    left: `${props.position.left}px`,
  };
});

// Format status
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

// Format date and time
function formatDateTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Function to get project name by ID
function getProjectName(projectId: number): string {
  const project = props.projects.find((p) => p.id === projectId);
  return project ? project.name : "Unknown Project";
}

// Close when Escape is pressed
onMounted(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      emit("close");
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });
});
</script>

<style lang="scss" scoped>
// Colors
$popover-bg: $white;
$border-color: $gray-300;
$text-color: $gray-800;
$accent-color: $orange-500;

.task-details-popover {
  position: absolute;
  width: 320px;
  background-color: $popover-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid $border-color;
    background-color: $gray-100;

    h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: $text-color;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: $gray-600;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: $gray-800;
      }
    }
  }

  .popover-content {
    padding: 15px;

    .task-content {
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 15px;
      word-break: break-word;
    }

    .task-meta {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 0.85rem;
      color: $gray-600;

      .task-status {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 500;

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

      .task-project {
        .project-tag {
          background-color: rgba($orange-200, 0.7);
          padding: 2px 6px;
          border-radius: 4px;
          color: $orange-700;
          font-weight: 500;
        }
      }

      .task-date {
        color: $gray-500;
      }
    }
  }
}
</style>
