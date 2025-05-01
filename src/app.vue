<template>
  <div
    :class="[
      'app-container',
      { 'with-overview': showOverview, 'with-canvas': showCanvas },
    ]"
  >
    <div
      :class="[
        'chat-container',
        { 'with-overview': showOverview, 'with-canvas': showCanvas },
      ]"
    >
      <!-- Chat Timeline -->
      <ChatTimeline
        :ref="(el) => setGlobalElementRef(el as HTMLElement, 'chatTimeline')"
      />

      <!-- Chat Input Area -->
      <ChatInput
        :is-db-ready="isDbReady"
        :ref="(el) => setGlobalElementRef(el as HTMLElement, 'chatInput')"
      />
    </div>

    <!-- Overview section -->
    <transition name="slide">
      <div v-if="showOverview" class="overview-container">
        <OverviewSection
          :ref="(el) => setGlobalElementRef(el as HTMLElement, 'overviewSection')"
        />
      </div>
    </transition>

    <!-- Canvas section -->
    <transition name="fade">
      <CanvasView v-if="showCanvas" />
    </transition>

    <!-- Commands Drawer -->
    <CommandsDrawer
      :ref="(el) => setGlobalElementRef(el as HTMLElement, 'commandDrawer')"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import CommandsDrawer from "./components/CommandsDrawer.vue";
import { useAiOverview } from "./composables/useAiOverview";
import { useCollections } from "./composables/useCollections";
import { useCommands } from "./composables/useCommands";
import { useEvents } from "./composables/useEvents";
import { useGlobalElementAffordances } from "./composables/useGlobalElementAffordances";
import { useNotes } from "./composables/useNotes";
import { useProjects } from "./composables/useProjects";
import { useTasks } from "./composables/useTasks";

const { chatInputRef, setGlobalElementRef, scrollChatTimelineToBotton } =
  useGlobalElementAffordances();

// Get command handling from composable
const { showOverview, overviewType, overviewMode, showCanvas } = useCommands();

// Get AI overview handling from composable
const { aiOverviewLoading, aiOverviewContent, generateAiOverview } =
  useAiOverview();

const { refreshTimeline } = useTimeline();
const isDbReady = ref(false);

useEventListeners();

// Initialize app
onMounted(async () => {
  if (process.client) {
    try {
      console.log("Component mounted client-side, initializing data...");

      // Initialize all data in parallel
      const { initialize: initTasks } = useTasks();
      const { initialize: initEvents } = useEvents();
      const { initialize: initNotes } = useNotes();

      // Create dummy refs for projects and collections (not used directly)
      const dummyMessage = ref("");
      const { loadProjectsData } = useProjects(dummyMessage);
      const { loadCollectionsData } = useCollections(dummyMessage);

      // Initialize entity data stores in parallel
      await Promise.all([
        initTasks(),
        initEvents(),
        initNotes(),
        loadProjectsData(),
        loadCollectionsData(),
      ]);

      isDbReady.value = true;
      console.log("All data initialized and ready to use");

      scrollChatTimelineToBotton();
    } catch (error) {
      console.error("Failed to initialize data:", error);
      isDbReady.value = false;
    }
  }
});
</script>

<style lang="scss">
@import "./styles/main.scss";

// App theme colors
$primary-bg: $gray-100;
$container-bg: $white;
$border-color: $gray-300;

body {
  padding-top: 5vh; // Add some space at the top
}

.app-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding-bottom: 40px;

  &.with-overview {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
}

.chat-container {
  width: 100%;
  max-width: 800px;
  min-width: 400px; // Smaller minimum width to fit better
  // background-color: $container-bg;
  border-radius: 4px;
  // box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 90vh; // Fixed height for the container
  overflow: hidden; // Hide overflow from children
  transition: width 0.3s ease, transform 0.3s ease;

  &.with-overview {
    width: 50%; // Reduce width when overview is open
    transform: translateX(0); // Don't move, just resize
  }

  &.with-canvas {
    // No transform needed as canvas is now positioned below
    z-index: 50;
  }
}

.overview-container {
  width: 50%; // Same width as chat when both are visible
  min-width: 400px;
  height: 90vh;
  overflow: hidden;
  position: relative;
  margin-left: 20px; // Add some space between containers
}

// Transitions
.slide-enter-active,
.slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
