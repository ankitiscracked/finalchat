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
        :timeline="timeline"
        :projects="projects"
        ref="chatTimelineRef"
      />

      <!-- Chat Input Area -->
      <ChatInput
        :is-db-ready="isDbReady"
        :command-types="commandTypes"
        :special-commands="specialCommands"
        :parse-message="parseMessage"
        :handle-special-commands="handleSpecialCommands"
        :timeline-items="timeline"
        :overview-type="overviewType"
        :selected-tasks="selectedTasks"
        :focused-task-id="focusedTaskId"
        :focus-active="focusActive"
        @edit-task="handleEditTask"
        @delete-tasks="deleteSelectedTasks"
        @move-tasks="handleMoveTasks"
        @message-submitted="handleMessageSubmitted"
        ref="chatInputRef"
      />
    </div>

    <!-- Overview section -->
    <transition name="slide">
      <div v-if="showOverview" class="overview-container">
        <OverviewSection
          :items="timeline"
          :type="overviewType"
          :mode="overviewMode"
          :is-loading="aiOverviewLoading"
          :ai-content="aiOverviewContent"
          :chat-input-ref="
            chatInputRef ? chatInputRef.$el.querySelector('textarea') : null
          "
          @close="showOverview = false"
          @change-mode="handleOverviewModeChange"
          @refresh="loadTimelineData"
          @selection-changed="handleSelectionChanged"
          ref="overviewSectionRef"
        />
      </div>
    </transition>

    <!-- Canvas section -->
    <transition name="fade">
      <CanvasView
        v-if="showCanvas"
        :onClose="handleCloseCanvas"
        :chatInputRef="
          chatInputRef ? chatInputRef.$el.querySelector('textarea') : null
        "
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { onKeyStroke, useMagicKeys } from "@vueuse/core";
import { getAllItems } from "./services/indexedDB";
import { loadProjects } from "./services/projectService";
import { useTaskOperations } from "./composables/useTaskOperations";

// Get command handling from composable
const {
  allItemTypes,
  commandTypes,
  specialCommands,
  showOverview,
  overviewType,
  overviewMode,
  showCanvas,
  parseMessage,
  handleShowCommand,
  handleCloseOverviewCommand,
  handleAiOverviewCommand,
  handleCanvasCommand,
  handleCloseCanvasCommand,
} = useCommands();

const { selectedTasks, focusState } = useTaskSelection();
watch(
  focusState,
  (newState) => {
    console.log("Focus state changed:", newState);
  },
  { deep: true }
);

// Get task operations from composable
const { timeline, loadTimelineData, deleteSelectedTasks, editTask, moveTasks } = useTaskOperations();

// Get AI overview handling from composable
const { aiOverviewLoading, aiOverviewContent, generateAiOverview } =
  useAiOverview();

// Refs
const isDbReady = ref(false);
const projects = ref<any[]>([]);
const chatTimelineRef = ref(null);
const chatInputRef = ref(null);
const overviewSectionRef = ref(null);

// Function to handle overview mode changes from the component
function handleOverviewModeChange(mode: "standard" | "ai"): void {
  overviewMode.value = mode;

  if (mode === "ai") {
    generateAiOverview(overviewType.value, timeline.value);
  }
}

// Function to handle closing the canvas
function handleCloseCanvas() {
  showCanvas.value = false;
}

// Function to handle special commands
function handleSpecialCommands(message: string): boolean {
  const showCommandResult = handleShowCommand(message);
  const closeCommandResult = handleCloseOverviewCommand(message);
  const aiOverviewCommandResult = handleAiOverviewCommand(message);
  const canvasCommandResult = handleCanvasCommand(message);
  const closeCanvasCommandResult = handleCloseCanvasCommand(message);

  if (showCommandResult.success) {
    // If it's a /show task command and we should activate task focus
    if (showCommandResult.activateTaskFocus) {
      console.log("Should activate task focus");
      // Add a small delay to ensure the overview section is fully rendered
      setTimeout(() => {
        console.log(
          "Attempting to activate task focus",
          overviewSectionRef.value
        );
        if (overviewSectionRef.value) {
          overviewSectionRef.value.activateTaskFocus();
        }
      }, 100); // Small delay to ensure DOM is updated
    }
    return true;
  }

  return (
    closeCommandResult.success ||
    aiOverviewCommandResult.success ||
    canvasCommandResult.success ||
    closeCanvasCommandResult.success
  );
}

// Handle message submission (reload timeline)
async function handleMessageSubmitted() {
  await loadTimelineData();
  scrollToBottom();
}

// Scroll to bottom of chat
function scrollToBottom() {
  if (chatTimelineRef.value) {
    (chatTimelineRef.value as any).scrollToBottom();
  }
}

// Load project data
const loadProjectsData = async () => {
  try {
    projects.value = await loadProjects();
    console.log(`Loaded ${projects.value.length} projects from IndexedDB.`);
  } catch (error) {
    console.error("Error loading projects:", error);
    projects.value = [];
  }
};

// Handle edit-task event from ChatInput
function handleEditTask(data) {
  editTask(data);
}

// Handle move-tasks event from ChatInput
function handleMoveTasks(data) {
  moveTasks(data);
}

onKeyStroke(["k"], (e) => {
  if (e.metaKey || e.ctrlKey) {
    const textarea = chatInputRef.value?.$el.querySelector("textarea");
    if (textarea) {
      textarea.focus();
      e.preventDefault();
    }
  }
});

// Initialize app
onMounted(async () => {
  if (process.client) {
    try {
      console.log(
        "Component mounted client-side, initializing IndexedDB connection..."
      );
      // Ensure DB is opened and upgraded
      await getAllItems();
      isDbReady.value = true;
      console.log("IndexedDB connection ready, loading data...");

      // Load projects and timeline data
      await Promise.all([loadProjectsData(), loadTimelineData()]);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
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

  &.with-canvas {
    // No special styles needed as canvas is now part of the document flow
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
