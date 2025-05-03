<template>
  <div v-if="serializedItems.length > 0">
    <div v-for="[date, items] in Object.entries(props.items)" :key="date">
      <div class="date-separator">{{ date }}</div>
      <template v-for="(item, idx) in items" :key="item.id">
        <template v-if="item.type === 'task'">
          <TaskItem
            :task="item as Task"
            :index="idx"
            :focused="idx === focusedIndex"
            :selected="selectedIndexes.has(idx)"
            :project-name="getProjectName(item.projectId!)"
            :handle-keydown="onKeyDown"
            :set-itemref="setItemRef"
          />
        </template>

        <template v-else>
          <div
            :class="[
              'overview-item',
              `item-${item.type}`,
              {
                focused: idx === focusedIndex,
              },
            ]"
            tabindex="0"
            @keydown="onKeyDown"
            :ref="(el) => (itemRefs[idx] = el)"
          >
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                :checked="selectedIndexes.has(idx)"
                @change="toggleSelection(idx)"
              />
            </div>
            <span class="item-icon">
              <i :class="getIconClass(item.type)"></i>
            </span>
            <div class="item-content">
              {{ item.content }}

              <!-- Show collection for notes and events with collectionId -->
              <span
                v-if="
                  (item.type === 'event' || item.type === 'default') &&
                  item.collectionId
                "
                class="item-collection"
              >
                in
                <span class="collection-tag">
                  @{{ getCollectionName(item.collectionId) }}</span
                >
              </span>

              <span class="item-timestamp">{{
                formatTime(item.createdAt)
              }}</span>
            </div>
          </div>
        </template>
      </template>
    </div>
  </div>
  <p v-else class="empty-overview">No {{ overviewType }} items found.</p>
</template>

<script setup lang="ts">
import type { Task, TimelineItem } from "~/models";
import { loadCollections as getAllCollections } from "../services/collectionService";
import { loadProjects as getAllProjects } from "../services/projectService";

const focusedItemId = defineModel("focusedItemId", {
  type: Number,
  default: null,
});
const selectedItemIds = defineModel("selectedItemIds", {
  type: Array,
  default: () => [],
});

const props = defineProps<{
  items: Record<string, TimelineItem[]>;
}>();

const { refreshTasks } = useTasks();
const { overviewType } = useCommands();

const focusedIndex = ref(0);
const selectedIndexes = ref<Set<number>>(new Set());
const itemRefs = ref<HTMLElement[]>([]);
// Task popover state
const activePopoverTaskId = ref<number | null>(null);

const serializedItems = computed(() =>
  Object.keys(props.items).flatMap((key) => props.items[key])
);

const serializedItemsCount = computed(() => serializedItems.value.length);

watch(focusedIndex, () => {
  focusedItemId.value = serializedItems.value[focusedIndex.value].id!;
});

watch(selectedIndexes, () => {
  selectedItemIds.value = [...selectedIndexes.value].map(
    (index) => serializedItems.value[index].id!
  );
});

function onKeyDown(e) {
  if (serializedItemsCount.value === 0) return;

  if (e.key === "ArrowDown") {
    focusedIndex.value = (focusedIndex.value + 1) % serializedItemsCount.value;
    itemRefs.value[focusedIndex.value].focus();
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    focusedIndex.value =
      (focusedIndex.value - 1 + serializedItemsCount.value) %
      serializedItemsCount.value;
    itemRefs.value[focusedIndex.value].focus();
    e.preventDefault();
  } else if (e.key === "Enter") {
    toggleSelection(focusedIndex.value);
    e.preventDefault();
  } else if (e.key === " " || e.key === "Spacebar" || e.key === "e") {
    activePopoverTaskId.value = serializedItems.value[focusedIndex.value].id!;
  }
}

function toggleSelection(index: number) {
  const newSet = new Set(selectedIndexes.value);

  if (newSet.has(index)) {
    newSet.delete(index);
  } else {
    newSet.add(index);
  }

  selectedIndexes.value = newSet;
}

// Handle popover open/close
const handlePopoverOpenChange = (isOpen: boolean, taskId?: number) => {
  if (isOpen && taskId) {
    activePopoverTaskId.value = taskId;

    // Update navigation state to match this task
    if (taskId) {
      //   focusItemById(taskId);
    }
  } else {
    activePopoverTaskId.value = null;
  }
};

// Save edited task
const saveEditedTask = async (editedTask: TimelineItem) => {
  try {
    // await updateItem(editedTask);
    await refreshTasks();
    // Close popover
    activePopoverTaskId.value = null;
  } catch (error) {
    console.error("Error updating task:", error);
  }
};

// Projects and collections state
const projects = ref<ProjectRecord[]>([]);
const collections = ref<CollectionRecord[]>([]);

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

function setItemRef(index: number, el: HTMLElement) {
  itemRefs.value[index] = el;
}

onMounted(async () => {
  if (serializedItems.value.length > 0) {
    focusedIndex.value = 0;
    console.log("item ref", itemRefs.value[0]);
    itemRefs.value[0].focus();
  }

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
</script>

<style lang="scss">
$text-color: $gray-900;
$date-color: $gray-600;

.date-separator {
  text-align: center;
  color: $date-color;
  font-size: 14px;
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
    font-size: 12px;
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
</style>
