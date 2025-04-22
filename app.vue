<template>
  <div :class="['app-container', { 'with-overview': showOverview }]">
    <div :class="['chat-container', { 'with-overview': showOverview }]">
      <div class="chat-timeline" id="chat-timeline" ref="chatTimelineRef">
        <!-- Iterate over grouped timeline items -->
        <template v-if="groupedTimeline.length > 0">
          <div v-for="([date, items], index) in groupedTimeline" :key="date">
            <div class="date-separator">{{ date }}</div>
            <div
              v-for="item in items"
              :key="item.id"
              :class="['message-bubble', `message-${item.type}`]"
            >
              <div class="message-content">
                <i :class="getIconClass(item.type)" class="message-icon"></i>
                <div class="message-text">
                  {{ item.content }}
                  <span class="message-timestamp">{{
                    formatTime(item.createdAt)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <!-- Show message if timeline is empty -->
        <p v-else-if="!timeline.length" class="empty-chat">
          Your timeline is empty. Add items below!
        </p>
        <!-- Keep loading text only initially -->
        <p v-else class="loading-chat">Loading timeline...</p>
      </div>
      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea
            ref="textareaRef"
            id="chat-input"
            :placeholder="
              isDbReady
                ? 'Type your message or command (/task, /spend, /event, /show, /ai-overview, /close-overview)...'
                : 'Initializing database...'
            "
            v-model="newMessage"
            @keydown.meta.enter.prevent="submitMessage"
            @keydown.ctrl.enter.prevent="submitMessage"
            @keydown.tab.prevent="completeCommand"
            @keydown="handleKeyDown"
            :disabled="!isDbReady"
          ></textarea>
          <div 
            v-if="suggestionText" 
            class="suggestion-overlay"
          >
            <span class="typed-part">{{ getTypedPart() }}</span><span class="suggestion-part">{{ suggestionText }}</span>
            <div class="suggestion-hint">hit Tab to complete</div>
          </div>
        </div>
        <button
          id="submit-button"
          @click="submitMessage"
          :disabled="!isDbReady"
        >
          <i class="ph-bold ph-paper-plane-right"></i>
        </button>
      </div>
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
import { ref, onMounted, computed, nextTick, watch } from "vue";
// Import the IndexedDB service functions and type
import {
  addItem,
  getAllItems,
  type TimelineItemRecord,
} from "./src/services/indexedDB";
import OverviewSection from "./src/components/OverviewSection.vue";

// Define item types (can be reused from schema or defined here)
const allItemTypes = ["task", "spend", "event", "note", "default"] as const;
type ItemType = (typeof allItemTypes)[number];
// Filter out 'default' for command suggestions
const commandTypes = allItemTypes.filter((t) => t !== "default");

// Define special commands
const specialCommands = ["show", "close-overview", "ai-overview"] as const;
type SpecialCommand = (typeof specialCommands)[number];

// --- Reactive Refs ---
const newMessage = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null); // Ref for the textarea element
const isDbReady = ref(false); // State to track DB initialization
const timeline = ref<TimelineItemRecord[]>([]); // Use the IndexedDB record type
const chatTimelineRef = ref<HTMLElement | null>(null); // Ref for scrolling
const messageCounter = ref(0); // Count messages to increment date
const currentDateOffset = ref(0); // Days to add to current date

// --- Command Suggestion State ---
const suggestionText = ref(""); // Text to show as suggestion
const cursorPosition = ref(0); // Horizontal position for suggestion overlay

// --- Overview State ---
const showOverview = ref(false);
const overviewType = ref("task");
const overviewMode = ref<"standard" | "ai">("standard");
const aiOverviewLoading = ref(false);
const aiOverviewContent = ref<{summary: string; insights: string[]} | null>(null);

// Helper function to parse message type and content
function parseMessage(message: string): { type: ItemType; content: string } {
  const trimmedMessage = message.trim();
  // Use commandTypes for parsing prefixes
  for (const type of commandTypes) {
    const prefix = `/${type} `;
    if (trimmedMessage.startsWith(prefix)) {
      return { type, content: trimmedMessage.substring(prefix.length) };
    }
  }
  // If no command prefix matches, treat as a note
  return { type: "note", content: trimmedMessage };
}

// Function to handle /show command
function handleShowCommand(message: string): boolean {
  const showRegex = /^\/show\s+(\w+)\s*$/;
  const match = message.match(showRegex);
  
  if (match) {
    const type = match[1];
    if (commandTypes.includes(type as ItemType)) {
      overviewType.value = type;
      showOverview.value = true;
      return true;
    }
  }
  return false;
}

// Function to handle /close-overview command
function handleCloseOverviewCommand(message: string): boolean {
  if (message.trim() === '/close-overview') {
    showOverview.value = false;
    return true;
  }
  return false;
}

// Function to handle /ai-overview command
function handleAiOverviewCommand(message: string): boolean {
  const aiOverviewRegex = /^\/ai-overview\s+(\w+)\s*$/;
  const match = message.match(aiOverviewRegex);
  
  if (match) {
    const type = match[1];
    if (commandTypes.includes(type as ItemType)) {
      overviewType.value = type;
      overviewMode.value = "ai";
      showOverview.value = true;
      generateAiOverview(type as ItemType);
      return true;
    }
  }
  return false;
}

// Function to handle overview mode changes from the component
function handleOverviewModeChange(mode: 'standard' | 'ai'): void {
  overviewMode.value = mode;
  
  if (mode === 'ai') {
    generateAiOverview(overviewType.value as ItemType);
  }
}

// Function to generate AI overview content
async function generateAiOverview(type: ItemType): Promise<void> {
  // Reset previous content and show loading state
  aiOverviewContent.value = null;
  aiOverviewLoading.value = true;
  
  try {
    // Filter items by type and last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const filteredItems = timeline.value.filter(item => 
      item.type === type && 
      item.createdAt >= oneWeekAgo
    );
    
    if (filteredItems.length === 0) {
      aiOverviewContent.value = {
        summary: `No ${type} items found from the past week.`,
        insights: []
      };
      aiOverviewLoading.value = false;
      return;
    }
    
    // Simulate AI API call with a timeout
    // In a real app, this would be an actual API call to Gemini API
    setTimeout(() => {
      // For demonstration purposes, generate a sample response
      // This would normally come from the AI API
      const summaryText = `Here's a summary of your ${type}s from the past week.`;
      const insightsList = generateMockInsights(type, filteredItems);
      
      aiOverviewContent.value = {
        summary: summaryText,
        insights: insightsList
      };
      
      aiOverviewLoading.value = false;
    }, 1500); // Simulate API delay
  } catch (error) {
    console.error("Error generating AI overview:", error);
    aiOverviewContent.value = {
      summary: "Failed to generate AI overview. Please try again.",
      insights: []
    };
    aiOverviewLoading.value = false;
  }
}

// Helper function to generate mock insights for demo purposes
function generateMockInsights(type: ItemType, items: TimelineItemRecord[]): string[] {
  // Get unique content from items to use as basis for insights
  const contents = items.map(item => item.content);
  
  switch (type) {
    case "task":
      return [
        "You've completed 60% of your tasks this week",
        "Most of your tasks were added on weekdays",
        "Consider breaking larger tasks into smaller, manageable chunks",
        "Try setting specific deadlines for outstanding tasks"
      ];
      
    case "spend":
      return [
        "Your total spending this week was higher than average",
        "Most expenses were in the 'groceries' category",
        "Consider setting a budget for discretionary spending",
        "You've reduced restaurant spending compared to last week"
      ];
      
    case "event":
      return [
        "You have 3 recurring weekly events",
        "Most of your events occur in the afternoon",
        "Try blocking focused work time between meetings",
        "Consider consolidating similar events to free up time"
      ];
      
    default:
      return [
        "Keep track of your activities to get more detailed insights",
        "Try using specific commands to categorize your entries",
        "Regular entries help build a more accurate overview"
      ];
  }
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
    hour12: true, // Use true or false based on preference
  });
}

// Helper to get icon class based on type
function getIconClass(type: ItemType): string {
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

// Helper to get the typed part for suggestion overlay
function getTypedPart(): string {
  if (!textareaRef.value) return "";
  
  const currentMessage = newMessage.value;
  const cursorPos = textareaRef.value.selectionStart;
  const textBeforeCursor = currentMessage.substring(0, cursorPos);
  
  // Check for /show command
  const showMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
  if (showMatch) {
    return `/show ${showMatch[1]}`;
  }
  
  // Check for /ai-overview command
  const aiOverviewMatch = textBeforeCursor.match(/^\/ai-overview\s+(\w*)$/);
  if (aiOverviewMatch) {
    return `/ai-overview ${aiOverviewMatch[1]}`;
  }
  
  // Regular command
  const slashIndex = textBeforeCursor.lastIndexOf("/");
  if (slashIndex !== -1) {
    return textBeforeCursor.substring(slashIndex);
  }
  
  return "";
}

// Computed property to group timeline items by date
const groupedTimeline = computed(() => {
  const groups: Record<string, TimelineItemRecord[]> = {}; // Use TimelineItemRecord
  timeline.value.forEach((item) => {
    const dateStr = formatDate(item.createdAt);
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(item);
  });
  // Return as an array of [date, items] pairs, sorted chronologically
  return Object.entries(groups).sort((a, b) => {
    // Convert date strings back to Date objects for comparison
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateA.getTime() - dateB.getTime();
  });
});

// Function to scroll to the bottom of the chat timeline
const scrollToBottom = async () => {
  await nextTick(); // Wait for DOM update
  const timelineEl = chatTimelineRef.value;
  if (timelineEl) {
    timelineEl.scrollTop = timelineEl.scrollHeight;
  }
};

const submitMessage = async () => {
  const messageText = newMessage.value.trim();
  if (!messageText) return;

  // Check if it's a special command
  if (
    handleShowCommand(messageText) || 
    handleCloseOverviewCommand(messageText) || 
    handleAiOverviewCommand(messageText)
  ) {
    newMessage.value = ""; // Clear input
    return;
  }

  const { type, content } = parseMessage(messageText);

  if (!content) {
    console.warn("Cannot submit empty content after command.");
    return; // Don't submit if only command was typed
  }

  // Create item for IndexedDB (id is auto-generated)
  const newItem: Omit<TimelineItemRecord, "id" | "createdAt"> = {
    type: type,
    content: content,
  };

  try {
    console.log("Saving item to IndexedDB:", newItem);
    
    // Increment message counter
    messageCounter.value++;
    
    // Increment date offset every 5 messages
    if (messageCounter.value % 5 === 0) {
      currentDateOffset.value++;
    }
    
    // Create a date with the offset applied
    const offsetDate = new Date();
    offsetDate.setDate(offsetDate.getDate() + currentDateOffset.value);
    
    // Use the offsetDate as createdAt
    await addItem({
      ...newItem,
      createdAt: offsetDate
    });
    
    console.log("Item saved successfully.");
    newMessage.value = ""; // Clear input
    await loadTimeline(); // Reload timeline to show the new item
  } catch (error) {
    console.error("Error saving timeline item to IndexedDB:", error);
    // Optionally: Show an error message to the user
  }
};

const loadTimeline = async () => {
  // isDbReady check is implicitly handled by getDbPromise inside getAllItems
  console.log("Loading timeline from IndexedDB...");
  try {
    // Use the getAllItems service function
    const items = await getAllItems();
    timeline.value = items; // Items are already sorted by ID in getAllItems
    console.log(`Loaded ${items.length} items from IndexedDB.`);
    await scrollToBottom(); // Scroll to bottom after loading
  } catch (error) {
    console.error("Error loading timeline items from IndexedDB:", error);
    timeline.value = []; // Clear timeline on error
  }
};

// --- Command Suggestion Logic ---

// Watch for changes in the input message to update suggestion
watch(newMessage, (newValue) => {
  updateSuggestion();
});

// Update the suggestion text based on current input and cursor position
const updateSuggestion = () => {
  if (!textareaRef.value) return;
  
  const currentMessage = newMessage.value;
  const cursorPos = textareaRef.value.selectionStart;
  const textBeforeCursor = currentMessage.substring(0, cursorPos);
  
  // Check for /show or /ai-overview command suggestions
  if (textBeforeCursor.match(/^\/show\s+$/) || textBeforeCursor.match(/^\/ai-overview\s+$/)) {
    // Suggest first command type
    suggestionText.value = commandTypes[0];
    return;
  }
  
  // Check for partial /show command type
  const showTypeMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
  if (showTypeMatch) {
    const partialType = showTypeMatch[1].toLowerCase();
    // Find matching command
    const matchingCommand = commandTypes.find(cmd => 
      cmd.startsWith(partialType) && cmd !== partialType
    );
    
    if (matchingCommand) {
      // Only suggest the remaining part of the command
      suggestionText.value = matchingCommand.substring(partialType.length);
    } else {
      suggestionText.value = "";
    }
    return;
  }
  
  // Check for partial /ai-overview command type
  const aiOverviewTypeMatch = textBeforeCursor.match(/^\/ai-overview\s+(\w*)$/);
  if (aiOverviewTypeMatch) {
    const partialType = aiOverviewTypeMatch[1].toLowerCase();
    // Find matching command
    const matchingCommand = commandTypes.find(cmd => 
      cmd.startsWith(partialType) && cmd !== partialType
    );
    
    if (matchingCommand) {
      // Only suggest the remaining part of the command
      suggestionText.value = matchingCommand.substring(partialType.length);
    } else {
      suggestionText.value = "";
    }
    return;
  }
  
  // Regular command suggestions (/)
  const slashIndex = textBeforeCursor.lastIndexOf("/");
  const spaceAfterSlashIndex = textBeforeCursor.indexOf(" ", slashIndex);
  
  // Check if we're typing a command (after / but before a space)
  if (
    slashIndex !== -1 && 
    (spaceAfterSlashIndex === -1 || spaceAfterSlashIndex > cursorPos) &&
    !/\s/.test(textBeforeCursor.substring(slashIndex + 1)) // No space between / and cursor
  ) {
    const partialCommand = textBeforeCursor.substring(slashIndex + 1).toLowerCase();
    
    // First check for special commands
    const matchingSpecialCommand = specialCommands.find(cmd => 
      cmd.startsWith(partialCommand) && cmd !== partialCommand
    );
    
    if (matchingSpecialCommand) {
      // Only suggest the remaining part of the command
      suggestionText.value = matchingSpecialCommand.substring(partialCommand.length);
      return;
    }
    
    // If no special command matches, check regular item type commands
    const matchingCommand = commandTypes.find(cmd => 
      cmd.startsWith(partialCommand) && cmd !== partialCommand
    );
    
    if (matchingCommand) {
      // Only suggest the remaining part of the command
      suggestionText.value = matchingCommand.substring(partialCommand.length);
    } else {
      suggestionText.value = "";
    }
  } else {
    suggestionText.value = "";
  }
};

// Complete the command when Tab is pressed
const completeCommand = () => {
  if (suggestionText.value) {
    const currentMessage = newMessage.value;
    const cursorPos = textareaRef.value?.selectionStart ?? currentMessage.length;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    const textAfterCursor = currentMessage.substring(cursorPos);
    
    // Handle /show command completion
    const showMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
    if (showMatch) {
      const partialType = showMatch[1];
      const fullType = partialType + suggestionText.value;
      
      newMessage.value = 
        "/show " + fullType + 
        textAfterCursor;
      
      nextTick(() => {
        const newCursorPos = "/show ".length + fullType.length;
        textareaRef.value?.focus();
        textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
        suggestionText.value = "";
      });
      return;
    }
    
    // Handle /ai-overview command completion
    const aiOverviewMatch = textBeforeCursor.match(/^\/ai-overview\s+(\w*)$/);
    if (aiOverviewMatch) {
      const partialType = aiOverviewMatch[1];
      const fullType = partialType + suggestionText.value;
      
      newMessage.value = 
        "/ai-overview " + fullType + 
        textAfterCursor;
      
      nextTick(() => {
        const newCursorPos = "/ai-overview ".length + fullType.length;
        textareaRef.value?.focus();
        textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
        suggestionText.value = "";
      });
      return;
    }
    
    // Check if it's a special command (like close-overview)
    const specialCommandMatch = specialCommands.find(cmd => 
      textBeforeCursor === `/${cmd.substring(0, cmd.length - suggestionText.value.length)}`
    );
    
    if (specialCommandMatch) {
      // Complete the special command
      newMessage.value = 
        `/${specialCommandMatch}` + 
        textAfterCursor;
      
      nextTick(() => {
        const newCursorPos = specialCommandMatch.length + 1; // +1 for /
        textareaRef.value?.focus();
        textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
        suggestionText.value = "";
      });
      return;
    }
    
    // Regular command completion
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    const partialCommand = textBeforeCursor.substring(slashIndex + 1);
    
    // Complete the command
    const fullCommand = partialCommand + suggestionText.value;
    newMessage.value = 
      currentMessage.substring(0, slashIndex) + 
      `/${fullCommand}` + 
      textAfterCursor;
    
    // Move cursor after the completed command
    nextTick(() => {
      const newCursorPos = slashIndex + fullCommand.length + 1; // +1 for /
      textareaRef.value?.focus();
      textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
      suggestionText.value = ""; // Clear suggestion
      
      // Add a space after the command if there isn't one already
      if (newMessage.value[newCursorPos] !== ' ' && !specialCommands.includes(fullCommand as any)) {
        newMessage.value = 
          newMessage.value.substring(0, newCursorPos) + 
          ' ' + 
          newMessage.value.substring(newCursorPos);
        
        // Move cursor after the space
        nextTick(() => {
          textareaRef.value?.setSelectionRange(newCursorPos + 1, newCursorPos + 1);
        });
      }
    });
  }
};

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  // Update suggestion on any key press
  nextTick(() => {
    updateSuggestion();
  });
  
  // Handle special keys if needed
  if (event.key === 'Escape' && suggestionText.value) {
    event.preventDefault();
    suggestionText.value = "";
  } else if (event.key === 'Escape' && showOverview.value) {
    event.preventDefault();
    showOverview.value = false;
  }
};

// Load timeline when the component mounts client-side
onMounted(async () => {
  // IndexedDB only works in the browser
  if (process.client) {
    try {
      console.log(
        "Component mounted client-side, initializing IndexedDB connection..."
      );
      // Trigger DB opening/creation by calling a function that uses getDbPromise
      // We don't need to store the DB instance itself here anymore.
      // Calling getAllItems also ensures the DB is opened/ready.
      await getAllItems(); // This ensures the DB is opened and potentially upgraded
      isDbReady.value = true; // Mark DB as ready
      console.log("IndexedDB connection ready, loading timeline...");
      await loadTimeline(); // Now load the timeline
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
      isDbReady.value = false; // Ensure DB is marked as not ready on error
      // Optionally show an error message to the user in the UI
    }
  }
});

// Cmd/Ctrl + Enter handling is done via @keydown on textarea
</script>

<style lang="scss">
@import "./styles/main.scss";

// App theme colors
$primary-bg: $gray-100;
$secondary-bg: $gray-200;
$container-bg: $white;
$text-color: $gray-900;
$border-color: $gray-300;
$accent-color: $orange-500;
$accent-dark: $orange-700;
$input-bg: $white;
$date-color: $gray-600;
$suggestion-color: $gray-400;

$message-default-bg: $gray-200;
$message-task-bg: $orange-100;
$message-spend-bg: $orange-100;
$message-event-bg: $orange-100;

$message-task-accent: $orange-500;
$message-spend-accent: $orange-600;
$message-event-accent: $orange-700;
$message-default-accent: $gray-700;

// Apply base styles globally (consider putting in nuxt.config or a global css file)
body {
  padding-top: 5vh; // Add some space at the top
}

// Scoped styles could be used if preferred, but these are mostly layout
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

.chat-timeline {
  flex-grow: 1;
  overflow-y: auto; // Allow scrolling for timeline content
  padding: 20px;
  border-bottom: 1px solid $border-color;
  background-color: $primary-bg;

  .date-separator {
    text-align: center;
    margin: 15px 0;
    color: $date-color;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 5px 0;
  }

  .empty-chat, .loading-chat {
    text-align: center;
    color: $gray-600;
    margin-top: 40px;
  }

  .message-bubble {
    display: flex;
    margin-bottom: 15px;
    max-width: 85%;
    
    &.message-default, &.message-note {
      margin-left: auto; // Right aligned
      .message-content {
        background-color: $message-default-bg;
        border-radius: 18px 18px 4px 18px;
        
        .message-icon {
          color: $message-default-accent;
        }
      }
    }
    
    &.message-task, &.message-spend, &.message-event {
      margin-right: auto; // Left aligned
      
      .message-content {
        border-radius: 18px 18px 18px 4px;
      }
    }
    
    &.message-task {
      .message-content {
        background-color: $message-task-bg;
        
        .message-icon {
          color: $message-task-accent;
        }
      }
    }
    
    &.message-spend {
      .message-content {
        background-color: $message-spend-bg;
        
        .message-icon {
          color: $message-spend-accent;
        }
      }
    }
    
    &.message-event {
      .message-content {
        background-color: $message-event-bg;
        
        .message-icon {
          color: $message-event-accent;
        }
      }
    }
    
    .message-content {
      padding: 12px 16px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      
      .message-icon {
        font-size: 1.2rem;
        margin-top: 2px;
      }
      
      .message-text {
        color: $text-color;
        word-wrap: break-word; // Ensure long words break
        font-size: 0.95rem;
        line-height: 1.4;
        
        .message-timestamp {
          font-size: 0.75rem;
          color: $gray-500;
          margin-top: 5px;
          display: block; // Ensure it appears below content
        }
      }
    }
  }
}

.chat-input-area {
  display: flex;
  padding: 15px;
  background-color: $white;
  border-top: 1px solid $border-color;

  .input-wrapper {
    position: relative;
    flex-grow: 1;
    margin-right: 10px;
  }

  textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid $border-color;
    border-radius: 18px;
    resize: none; // Prevent manual resizing
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    min-height: 48px; // Minimum height
    max-height: 120px; // Maximum height before scrolling
    overflow-y: auto; // Allow scrolling if text exceeds max-height
    transition: border-color 0.2s ease;
    
    &:focus {
      outline: none;
      border-color: $accent-color;
      box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
    }
  }

  .suggestion-overlay {
    position: absolute;
    top: 12px; // Match textarea padding
    left: 15px; // Match textarea padding
    pointer-events: none; // Allow clicks to pass through to textarea
    
    .typed-part {
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
    }
    
    .suggestion-part {
      color: $suggestion-color;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
    }
    
    .suggestion-hint {
      position: absolute;
      top: 100%;
      left: 0;
      font-size: 0.7rem;
      color: $gray-500;
      margin-top: 4px;
      background-color: $gray-100;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid $gray-300;
      white-space: nowrap;
    }
  }

  button {
    width: 48px;
    height: 48px;
    background-color: $accent-color;
    color: $white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: $accent-dark;
    }
    
    &:disabled {
      background-color: $gray-400;
      cursor: not-allowed;
    }
  }
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