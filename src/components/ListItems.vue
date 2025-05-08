<template>
  <div class="flex flex-col gap-4" v-if="serializedItems.length > 0">
    <div
      class="flex flex-col gap-2 items-center"
      v-for="[date, items] in Object.entries(props.items)"
      :key="date"
    >
      <span class="text-xs font-semibold text-stone-500">{{ date }}</span>
      <div
        v-if="_.isEmpty(items)"
        class="flex justify-center w-full p-4 bg-stone-50 rounded-sm"
      >
        <span class="text-xs text-stone-500">No tasks for {{ date }}</span>
      </div>

      <div v-else class="flex flex-col gap-4 w-full focus:bg-stone-50">
        <div
          class="flex flex-col gap-4"
          v-for="(item, idx) in items"
          :key="item.id"
        >
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
        </div>
      </div>
    </div>
  </div>
  <p v-else class="empty-overview">No {{ overviewType }} items found.</p>
</template>

<script setup lang="ts">
import type { Task, TimelineItem } from "~/models";
import { loadCollections as getAllCollections } from "../services/collectionService";
import _ from "lodash";

const { selectedItemIds } = useGlobalContext();
const props = defineProps<{
  items: Record<string, TimelineItem[]>;
}>();

const { overviewType } = useCommands();

const serializedItems = computed(() =>
  Object.keys(props.items).flatMap((key) => props.items[key])
);

const serializedItemsCount = computed(() => serializedItems.value.length);

const { focusedIndex, selectedIndexes, itemRefs, setItemRef, onKeyDown } =
  useListItems(serializedItemsCount.value);

watch(selectedIndexes, () => {
  selectedItemIds.value = [...selectedIndexes.value].map(
    (index) => serializedItems.value[index].id!
  );
});

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
