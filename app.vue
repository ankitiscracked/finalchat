<template>
  <div :class="['app-container', { 'with-overview': showOverview }]">
    <div :class="['chat-container', { 'with-overview': showOverview }]">
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
        @message-submitted="handleMessageSubmitted"
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
          @close="showOverview = false"
          @change-mode="handleOverviewModeChange"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAllItems, type TimelineItemRecord } from "./src/services/indexedDB";
import { loadProjects } from "./src/services/projectService";
import { loadTimelineItems } from "./src/services/timelineService";
import { useCommands } from "./src/composables/useCommands";
import { useAiOverview } from "./src/composables/useAiOverview";

// Components
import ChatTimeline from "./src/components/chat/ChatTimeline.vue";
import ChatInput from "./src/components/chat/ChatInput.vue";
import OverviewSection from "./src/components/OverviewSection.vue";

// Get command handling from composable
const { 
  allItemTypes,
  commandTypes, 
  specialCommands,
  showOverview, 
  overviewType, 
  overviewMode,
  parseMessage,
  handleShowCommand,
  handleCloseOverviewCommand,
  handleAiOverviewCommand
} = useCommands();

// Get AI overview handling from composable
const {
  aiOverviewLoading,
  aiOverviewContent,
  generateAiOverview
} = useAiOverview();

// Refs
const isDbReady = ref(false);
const timeline = ref<TimelineItemRecord[]>([]);
const projects = ref<any[]>([]);
const chatTimelineRef = ref(null);

// Function to handle overview mode changes from the component
function handleOverviewModeChange(mode: 'standard' | 'ai'): void {
  overviewMode.value = mode;
  
  if (mode === 'ai') {
    generateAiOverview(overviewType.value, timeline.value);
  }
}

// Function to handle special commands
function handleSpecialCommands(message: string): boolean {
  return (
    handleShowCommand(message) || 
    handleCloseOverviewCommand(message) || 
    handleAiOverviewCommand(message)
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

// Load timeline data
const loadTimelineData = async () => {
  try {
    timeline.value = await loadTimelineItems();
    console.log(`Loaded ${timeline.value.length} items from IndexedDB.`);
    scrollToBottom();
  } catch (error) {
    console.error("Error loading timeline items:", error);
    timeline.value = [];
  }
};

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

// Initialize app
onMounted(async () => {
  if (process.client) {
    try {
      console.log("Component mounted client-side, initializing IndexedDB connection...");
      // Ensure DB is opened and upgraded
      await getAllItems();
      isDbReady.value = true;
      console.log("IndexedDB connection ready, loading data...");
      
      // Load projects and timeline data
      await Promise.all([
        loadProjectsData(),
        loadTimelineData()
      ]);
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
  justify-content: center;
  overflow: hidden; // Prevent horizontal scrolling
  position: relative;
  
  &.with-overview {
    justify-content: space-between; // Space out the containers when overview is open
  }
}

.chat-container {
  width: 100%;
  max-width: 800px;
  min-width: 400px; // Smaller minimum width to fit better
  background-color: $container-bg;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 80vh; // Fixed height for the container
  overflow: hidden; // Hide overflow from children
  transition: width 0.3s ease, transform 0.3s ease;
  
  &.with-overview {
    width: 50%; // Reduce width when overview is open
    transform: translateX(0); // Don't move, just resize
  }
}

.overview-container {
  width: 50%; // Same width as chat when both are visible
  min-width: 400px;
  height: 80vh;
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
</style>