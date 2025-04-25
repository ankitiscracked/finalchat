<template>
  <div class="overview-section">
    <div class="overview-header">
      <div class="header-left">
        <h2>{{ capitalizeFirst(type) }} Overview</h2>
        <div class="mode-selector" v-if="mode === 'standard'">
          <button @click="$emit('changeMode', 'ai')" class="ai-button">
            <i class="ph-bold ph-robot"></i> AI Overview
          </button>
        </div>
        <div class="mode-selector" v-else>
          <button
            @click="$emit('changeMode', 'standard')"
            class="standard-button"
          >
            <i class="ph-bold ph-list"></i> Standard View
          </button>
        </div>
      </div>
      <button @click="$emit('close')" class="close-button">
        <i class="ph-bold ph-x"></i>
      </button>
    </div>

    <!-- Standard overview mode -->
    <div v-if="mode === 'standard'" class="overview-content">
      <template v-if="groupedItems.length > 0">
        <div v-for="([date, items], index) in groupedItems" :key="date">
          <div class="date-separator">{{ date }}</div>
          <div
            v-for="(item, idx) in items"
            :key="item.id"
            :class="[
              'overview-item',
              `item-${item.type}`,
              {
                focused:
                  item.type === 'task' &&
                  focusState.isActive &&
                  item.id === focusState.currentTaskId,
              },
            ]"
            :ref="
              (el) =>
                item.type === 'task' ? setTaskRef(el, getTaskIndex(item)) : null
            "
            :tabindex="item.type === 'task' ? 0 : -1"
            @keydown="
              item.type === 'task' ? handleTaskKeyPress($event, item) : null
            "
          >
            <span class="item-icon">
              <i :class="getIconClass(item.type)"></i>
            </span>
            <div class="item-content">
              {{ item.content }}

              <!-- Show status for tasks -->
              <span
                v-if="item.type === 'task'"
                class="item-status"
                :class="[`status-${item.status || 'todo'}`]"
              >
                {{ formatStatus(item.status || "todo") }}
              </span>

              <!-- Show project for tasks with projectId -->
              <span
                v-if="item.type === 'task' && item.projectId"
                class="item-project"
              >
                in
                <span class="project-tag"
                  >#{{ getProjectName(item.projectId) }}</span
                >
              </span>

              <!-- Show collection for notes and events with collectionId -->
              <span
                v-if="
                  (item.type === 'event' || item.type === 'default') &&
                  item.collectionId
                "
                class="item-collection"
              >
                in
                <span class="collection-tag"
                  >@{{ getCollectionName(item.collectionId) }}</span
                >
              </span>

              <span class="item-timestamp">{{
                formatTime(item.createdAt)
              }}</span>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="empty-overview">No {{ type }} items found.</p>
    </div>

    <!-- AI overview mode -->
    <div v-else class="overview-content ai-content">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Generating AI overview...</p>
      </div>

      <div v-else-if="aiContent" class="ai-overview">
        <div class="ai-summary">
          <p>{{ aiContent.summary }}</p>
        </div>

        <div class="ai-insights" v-if="aiContent.insights.length > 0">
          <h3>Insights & Actions</h3>
          <ul>
            <li v-for="(insight, index) in aiContent.insights" :key="index">
              {{ insight }}
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="ai-overview empty-overview">
        <p>No AI overview available. Try adding more {{ type }} items.</p>
      </div>
    </div>

    <!-- Task Actions Popover -->
    <TaskActionsPopover
      v-if="showActionsPopover && currentTask"
      :position="actionsPopoverPosition"
      :nextStatusLabel="nextStatusLabel"
      :previousStatusLabel="previousStatusLabel"
      @close="closeActionsPopover"
      @forwardStatus="changeTaskStatusForward"
      @backwardStatus="changeTaskStatusBackward"
      @delete="deleteTask"
    />
    <!-- Debug info -->
    <div v-if="type === 'task'" class="debug-info">
      <p>Focus active: {{ focusState.isActive }}</p>
      <p>Current index: {{ focusState.currentIndex }}</p>
      <p>Current task ID: {{ focusState.currentTaskId }}</p>
      <p>Showing actions popover: {{ showActionsPopover }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Define props
const props = defineProps<{
  items: TimelineItemRecord[];
  type: string;
  mode: "standard" | "ai";
  isLoading?: boolean;
  aiContent?: { summary: string; insights: string[] } | null;
  chatInputRef?: HTMLTextAreaElement | null;
}>();

// Define emits
const emit = defineEmits(["close", "changeMode", "refresh"]);

// All tasks from the items array
const tasks = computed(() =>
  props.items.filter((item) => item.type === "task")
);

// Cache of task indices for quick lookup
const taskIndexMap = ref(new Map<number, number>());

// Helper function to get task index in the tasks array
function getTaskIndex(task: TimelineItemRecord): number {
  if (!task.id) {
    throw new Error("Task is missing an id. All tasks must have a valid id.");
  }

  // Update taskIndexMap whenever tasks change
  if (taskIndexMap.value.size !== tasks.value.length) {
    taskIndexMap.value.clear();
    tasks.value.forEach((task, index) => {
      if (task.id) taskIndexMap.value.set(task.id, index);
    });
  }

  return taskIndexMap.value.get(task.id) ?? -1;
}

// Focus management using our composable
const {
  focusState,
  taskRefs,
  setTaskRef,
  currentTask,
  activateTaskFocus,
  navigateTasks,
  deactivateTaskFocus,
  handleTaskKeydown,
} = useFocusable(tasks, ref(props.chatInputRef));

// Expose activateTaskFocus method to the parent component
defineExpose({
  activateTaskFocus,
});

// Force update task refs when items change
watch(
  () => props.items,
  () => {
    nextTick(() => {
      taskIndexMap.value.clear();

      // Re-initialize task refs
      if (props.type === "task" && tasks.value.length > 0) {
        console.log("Tasks available after items update:", tasks.value.length);
      }
    });
  },
  { deep: true }
);

// Watch for type changes to ensure proper focus handling
watch(
  () => props.type,
  (newType) => {
    if (newType === "task") {
      console.log("Overview type changed to task");
      // Clear any previous focus state
      focusState.value.isActive = false;
      focusState.value.currentIndex = -1;

      // Wait for the DOM to update
      nextTick(() => {
        // Reset task index map to force ref recalculation
        taskIndexMap.value.clear();
      });
    }
  },
  { immediate: true }
);

// Refresh items
const refreshItems = async () => {
  emit("refresh");
};

// Task actions composable
const {
  showActionsPopover,
  actionsPopoverPosition,
  nextStatusLabel,
  previousStatusLabel,
  openActionsPopover,
  closeActionsPopover,
  changeTaskStatusForward,
  changeTaskStatusBackward,
  deleteTask,
} = useTaskActions(currentTask, refreshItems);

// Handle key press on tasks
function handleTaskKeyPress(event: KeyboardEvent, task: TimelineItemRecord) {
  // Directly check for the 'a' key first
  if (event.key === "a") {
    console.log("A key pressed on task", task);

    // Update the current task focus state to match this task
    const taskIndex = getTaskIndex(task);
    if (taskIndex >= 0) {
      focusState.value.currentIndex = taskIndex;
      focusState.value.currentTaskId = task.id || null;
    }

    // Use the target element for positioning
    const taskElement = event.target as HTMLElement;
    openActionsPopover(taskElement);
    event.preventDefault();
    return;
  }

  // Handle arrow keys and other navigation
  if (event.key === "ArrowUp") {
    console.log("Arrow Up pressed on task");
    event.preventDefault();
    navigateTasks(-1);
    return;
  }

  if (event.key === "ArrowDown") {
    console.log("Arrow Down pressed on task");
    event.preventDefault();
    navigateTasks(1);
    return;
  }

  if (event.key === "Escape") {
    console.log("Escape pressed on task");
    event.preventDefault();
    deactivateTaskFocus();
    return;
  }

  // Fall back to the composable's handler
  handleTaskKeydown(event);
}

// Helper function to format date
function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper function to format time
function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper to format status
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

// Helper to get icon class based on type
function getIconClass(type: string): string {
  switch (type) {
    case "task":
      return "ph-bold ph-check-circle";
    case "spend":
      return "ph-bold ph-currency-dollar";
    case "event":
      return "ph-bold ph-calendar";
    case "note":
      return "ph-bold ph-note-pencil";
    default:
      return "ph-bold ph-chat-text";
  }
}

// Helper to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Projects and collections state
const projects = ref<ProjectRecord[]>([]);
const collections = ref<CollectionRecord[]>([]);

// Load projects and collections from IndexedDB
onMounted(async () => {
  try {
    const [projectsData, collectionsData] = await Promise.all([
      getAllProjects(),
      getAllCollections(),
    ]);
    projects.value = projectsData;
    collections.value = collectionsData;
  } catch (error) {
    console.error("Error loading data:", error);
  }
});

// Function to get project name by ID
function getProjectName(projectId: number): string {
  const project = projects.value.find((p) => p.id === projectId);
  return project ? project.name : "Unknown Project";
}

// Function to get collection name by ID
function getCollectionName(collectionId: number): string {
  const collection = collections.value.find((c) => c.id === collectionId);
  return collection ? collection.name : "Unknown Collection";
}

// Group items by date
const groupedItems = computed(() => {
  const filteredItems = props.items.filter((item) => item.type === props.type);
  const groups: Record<string, TimelineItemRecord[]> = {};

  filteredItems.forEach((item) => {
    const dateStr = formatDate(item.createdAt);
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(item);
  });

  // Return as an array of [date, items] pairs, sorted chronologically (newest first)
  return Object.entries(groups).sort((a, b) => {
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateB.getTime() - dateA.getTime(); // Reverse order (newest first)
  });
});
</script>

<style lang="scss" scoped>
@import "../styles/main.scss";

// Overview colors
$overview-bg: $white;
$border-color: $gray-300;
$header-bg: $gray-100;
$text-color: $gray-900;
$date-color: $gray-600;
$ai-color: $orange-600;

.overview-section {
  background-color: $overview-bg;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid $border-color;
  background-color: $header-bg;

  .header-left {
    display: flex;
    align-items: center;

    h2 {
      margin: 0;
      font-size: 1.4rem;
      margin-right: 15px;
      font-weight: 600;
      color: $gray-800;
    }

    .mode-selector {
      button {
        background-color: $white;
        border: 1px solid $border-color;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        font-family: "Inter", sans-serif;

        i {
          margin-right: 8px;
          font-size: 1.1rem;
        }

        &:hover {
          background-color: $gray-200;
        }

        &.ai-button {
          color: $orange-700;
          i {
            color: $orange-700;
          }
          &:hover {
            background-color: rgba($orange-100, 0.8);
          }
        }

        &.standard-button {
          color: $gray-700;
          i {
            color: $gray-700;
          }
        }
      }
    }
  }

  .close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: $gray-600;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: $gray-800;
    }
  }
}

.overview-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;

  .date-separator {
    text-align: center;
    margin: 15px 0;
    color: $date-color;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 5px 0;
  }

  .empty-overview {
    text-align: center;
    color: $gray-600;
    margin-top: 40px;
  }

  .overview-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15px;
    padding: 12px 16px;
    border-radius: 10px;
    background-color: $gray-100;

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
      font-size: 0.95rem;
      line-height: 1.4;
    }

    .item-project,
    .item-collection {
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
      font-weight: 500;
    }

    .item-collection .collection-tag {
      background-color: rgba($orange-300, 0.7);
      padding: 2px 6px;
      border-radius: 4px;
      color: $orange-800;
      font-weight: 500;
    }

    .item-timestamp {
      font-size: 0.75rem;
      color: $gray-500;
      margin-top: 5px;
      display: block;
    }

    // Task status styles
    .item-status {
      display: inline-block;
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 4px;
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

    // Focus styles
    &.focused {
      background-color: rgba($orange-100, 0.5);
      outline: 2px solid $orange-400;
    }

    // Type-specific styles
    &.item-task {
      border-left: 4px solid $orange-500;
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
    &.item-spend {
      border-left: 4px solid $orange-600;
      .item-icon {
        color: $orange-600;
      }
    }
    &.item-event {
      border-left: 4px solid $orange-700;
      .item-icon {
        color: $orange-700;
      }
    }
    &.item-note {
      border-left: 4px solid $orange-400;
      .item-icon {
        color: $orange-400;
      }
    }
    &.item-default {
      border-left: 4px solid $gray-700;
      .item-icon {
        color: $gray-700;
      }
    }
  }

  // AI Overview specific styles
  &.ai-content {
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba($orange-300, 0.2);
        border-radius: 50%;
        border-top-color: $orange-500;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      p {
        color: $orange-700;
        font-weight: 500;
      }
    }

    .ai-overview {
      padding: 10px;

      .ai-summary {
        margin-bottom: 20px;
        font-size: 1.1rem;
        line-height: 1.5;
        color: $text-color;
      }

      .ai-insights {
        background-color: rgba($orange-100, 0.5);
        padding: 15px 20px;
        border-radius: 10px;
        border-left: 4px solid $orange-500;

        h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: $orange-700;
          font-size: 1.1rem;
          font-weight: 600;
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            margin-bottom: 10px;
            line-height: 1.4;
            color: $gray-800;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}

.debug-info {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 1000;

  p {
    margin: 3px 0;
  }
}
</style>
