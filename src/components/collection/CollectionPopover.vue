<template>
  <div
    class="collection-popover"
    :style="{ top: `${position.top}px`, left: `${position.left}px` }"
  >
    <div class="popover-header">
      <input
        ref="inputRef"
        v-model="searchQuery"
        placeholder="Search or create collection..."
        @input="filterCollections"
        @keydown.enter="selectOrCreateCollection"
        @keydown.escape="$emit('close')"
        @keydown.up="navigateList(-1)"
        @keydown.down="navigateList(1)"
      />
    </div>

    <div v-if="isLoading" class="loading-indicator">
      <div class="spinner"></div>
      <span>Loading collections...</span>
    </div>

    <div v-else class="collection-list">
      <div
        v-for="(collection, index) in filteredCollections"
        :key="collection.id"
        :class="['collection-item', { active: selectedIndex === index }]"
        @click="selectCollection(collection)"
        @mouseover="selectedIndex = index"
      >
        <span class="collection-icon">
          <i class="ph-bold ph-folder"></i>
        </span>
        <span class="collection-name">{{ collection.name }}</span>
      </div>

      <div
        v-if="showCreateOption"
        :class="[
          'create-item',
          { active: selectedIndex === filteredCollections.length },
        ]"
        @click="createCollection"
        @mouseover="selectedIndex = filteredCollections.length"
      >
        <span class="create-icon">
          <i class="ph-bold ph-plus-circle"></i>
        </span>
        <span class="create-text"
          >Create "<strong>{{ searchQuery }}</strong
          >"</span
        >
      </div>

      <div
        v-if="filteredCollections.length === 0 && !showCreateOption"
        class="no-results"
      >
        No collections found. Type to create a new one.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createCollection as addCollection,
  loadCollections as getAllCollections,
} from "../../services/collectionService";

const props = defineProps<{
  position: { top: number; left: number };
}>();

// Emits
const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", collection: CollectionRecord): void;
  (e: "create", collection: CollectionRecord): void;
}>();

// Refs
const inputRef = ref<HTMLInputElement | null>(null);
const collections = ref<CollectionRecord[]>([]);
const filteredCollections = ref<CollectionRecord[]>([]);
const searchQuery = ref("");
const selectedIndex = ref(0);
const isLoading = ref(true);

// Computed
const showCreateOption = computed(() => {
  const trimmedQuery = searchQuery.value.trim();
  return (
    trimmedQuery.length > 0 &&
    !collections.value.some(
      (c) => c.name.toLowerCase() === trimmedQuery.toLowerCase()
    )
  );
});

// Load collections when component mounts
onMounted(async () => {
  try {
    // Focus the input
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
      }
    });

    // Load collections
    collections.value = await getAllCollections();
    filteredCollections.value = [...collections.value];

    isLoading.value = false;
  } catch (error) {
    console.error("Error loading collections:", error);
    isLoading.value = false;
  }
});

// Watch for search query changes and reset selected index
watch(searchQuery, () => {
  selectedIndex.value = 0;
});

// Filter collections based on search query
function filterCollections() {
  const query = searchQuery.value.trim().toLowerCase();
  filteredCollections.value = collections.value.filter((collection) =>
    collection.name.toLowerCase().includes(query)
  );
}

// Navigate list with keyboard
function navigateList(direction: number) {
  const maxIndex = showCreateOption.value
    ? filteredCollections.value.length
    : filteredCollections.value.length - 1;

  selectedIndex.value += direction;

  // Wrap around
  if (selectedIndex.value < 0) {
    selectedIndex.value = maxIndex;
  } else if (selectedIndex.value > maxIndex) {
    selectedIndex.value = 0;
  }
}

// Select collection
function selectCollection(collection: CollectionRecord) {
  emit("select", collection);
}

// Select or create based on current selection
function selectOrCreateCollection() {
  if (
    filteredCollections.value.length === 0 ||
    selectedIndex.value === filteredCollections.value.length
  ) {
    createCollection();
  } else {
    selectCollection(filteredCollections.value[selectedIndex.value]);
  }
}

// Create a new collection
async function createCollection() {
  const name = searchQuery.value.trim();
  if (!name) return;

  try {
    const newCollection = await addCollection(name);
    collections.value.push(newCollection);
    emit("create", newCollection);
  } catch (error) {
    console.error("Error creating collection:", error);
  }
}
</script>

<style lang="scss" scoped>
$border-color: $gray-300;
$popover-bg: $white;
$active-bg: $gray-100;
$hover-bg: $gray-100;
$text-color: $gray-800;
$secondary-text: $gray-600;
$accent-color: $orange-500;
$accent-bg: rgba($orange-100, 0.5);

.collection-popover {
  position: absolute;
  width: 280px;
  background-color: $popover-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;

  .popover-header {
    padding: 10px;
    border-bottom: 1px solid $border-color;

    input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $border-color;
      border-radius: 6px;
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: $accent-color;
        box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
      }
    }
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: $secondary-text;
    font-size: 0.9rem;

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba($accent-color, 0.2);
      border-top-color: $accent-color;
      border-radius: 50%;
      margin-right: 10px;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  }

  .collection-list {
    max-height: 220px;
    overflow-y: auto;
    padding: 5px 0;

    .collection-item,
    .create-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 0.9rem;
      color: $text-color;

      &:hover {
        background-color: $hover-bg;
      }

      &.active {
        background-color: $accent-bg;
      }

      .collection-icon,
      .create-icon {
        margin-right: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        color: $accent-color;
      }
    }

    .create-item {
      border-top: 1px solid $border-color;
      color: $accent-color;
      font-weight: 500;
    }

    .no-results {
      padding: 15px;
      text-align: center;
      color: $secondary-text;
      font-size: 0.9rem;
    }
  }
}
</style>
