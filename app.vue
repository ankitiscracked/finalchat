<template>
  <div class="app-container">
    <!-- Added a wrapper for potential global layout -->
    <div class="chat-container">
      <div class="chat-timeline" id="chat-timeline" ref="chatTimelineRef">
        <!-- Iterate over grouped timeline items -->
        <template v-if="groupedTimeline.length > 0">
          <div v-for="([date, items], index) in groupedTimeline" :key="date">
            <div class="date-separator">{{ date }}</div>
            <div
              v-for="item in items"
              :key="item.id"
              :class="['timeline-item', `item-${item.type}`]"
            >
              <span class="item-icon">
                <i :class="getIconClass(item.type)"></i>
              </span>
              <div class="item-content">
                {{ item.content }}
                <span class="item-timestamp">{{
                  formatTime(item.createdAt)
                }}</span>
              </div>
            </div>
          </div>
        </template>
        <!-- Show message if timeline is empty -->
        <p v-else-if="!timeline.length">
          Your timeline is empty. Add items below!
        </p>
        <!-- Keep loading text only initially -->
        <p v-else>Loading timeline...</p>
      </div>
      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea
            ref="textareaRef"
            id="chat-input"
            :placeholder="
              isDbReady
                ? 'Type your message or command (@task, @spend, @event)...'
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
            :style="{ left: `${cursorPosition}px` }"
          >
            <span class="suggestion-text">{{ suggestionText }}</span>
          </div>
        </div>
        <button
          id="submit-button"
          @click="submitMessage"
          :disabled="!isDbReady"
        >
          {{ isDbReady ? "Submit" : "Loading..." }}
        </button>
      </div>
    </div>
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

// Define item types (can be reused from schema or defined here)
const allItemTypes = ["task", "spend", "event", "default"] as const;
type ItemType = (typeof allItemTypes)[number];
// Filter out 'default' for command suggestions
const commandTypes = allItemTypes.filter((t) => t !== "default");

// --- Reactive Refs ---
const newMessage = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null); // Ref for the textarea element
const isDbReady = ref(false); // State to track DB initialization
const timeline = ref<TimelineItemRecord[]>([]); // Use the IndexedDB record type
const chatTimelineRef = ref<HTMLElement | null>(null); // Ref for scrolling

// --- Command Suggestion State ---
const suggestionText = ref(""); // Text to show as suggestion
const cursorPosition = ref(0); // Horizontal position for suggestion overlay

// Helper function to parse message type and content
function parseMessage(message: string): { type: ItemType; content: string } {
  const trimmedMessage = message.trim();
  // Use commandTypes for parsing prefixes
  for (const type of commandTypes) {
    const prefix = `@${type} `;
    if (trimmedMessage.startsWith(prefix)) {
      return { type, content: trimmedMessage.substring(prefix.length) };
    }
  }
  // If no command prefix matches, treat as default message
  return { type: "default", content: trimmedMessage };
}

// Function to format the message with styled commands
// This is a placeholder for future enhancement to style commands in the input
function formatMessageWithCommands(message: string): string {
  // This would be implemented to wrap @commands in spans with the command-text class
  return message;
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
      return "fa-solid fa-list-check";
    case "spend":
      return "fa-solid fa-dollar-sign";
    case "event":
      return "fa-solid fa-calendar-day";
    default:
      return "fa-solid fa-message";
  }
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

  const { type, content } = parseMessage(messageText);

  if (!content) {
    console.warn("Cannot submit empty content after command.");
    return; // Don't submit if only command was typed
  }

  // Create item for IndexedDB (id is auto-generated, createdAt defaults in addItem)
  const newItem: Omit<TimelineItemRecord, "id" | "createdAt"> = {
    type: type,
    content: content,
  };

  try {
    console.log("Saving item to IndexedDB:", newItem);
    // Use the addItem service function
    await addItem(newItem);
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
  const atIndex = textBeforeCursor.lastIndexOf("@");
  const spaceAfterAtIndex = textBeforeCursor.indexOf(" ", atIndex);
  
  // Check if we're typing a command (after @ but before a space)
  if (
    atIndex !== -1 && 
    (spaceAfterAtIndex === -1 || spaceAfterAtIndex > cursorPos) &&
    !/\s/.test(textBeforeCursor.substring(atIndex + 1)) // No space between @ and cursor
  ) {
    const partialCommand = textBeforeCursor.substring(atIndex + 1).toLowerCase();
    
    // Find matching command
    const matchingCommand = commandTypes.find(cmd => 
      cmd.startsWith(partialCommand) && cmd !== partialCommand
    );
    
    if (matchingCommand) {
      // Only suggest the remaining part of the command
      suggestionText.value = matchingCommand.substring(partialCommand.length);
      
      // Calculate position for the suggestion overlay
      // This is a simplified approach - might need adjustment based on font metrics
      const textWidth = getTextWidth(textBeforeCursor, textareaRef.value);
      cursorPosition.value = textWidth;
    } else {
      suggestionText.value = "";
    }
  } else {
    suggestionText.value = "";
  }
};

// Helper to estimate text width for positioning the suggestion
const getTextWidth = (text: string, element: HTMLElement): number => {
  // Create a temporary span to measure text
  const span = document.createElement('span');
  span.style.font = window.getComputedStyle(element).font;
  span.style.visibility = 'hidden';
  span.style.position = 'absolute';
  span.style.whiteSpace = 'pre';
  span.textContent = text;
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width;
  document.body.removeChild(span);
  return width;
};

// Complete the command when Tab is pressed
const completeCommand = () => {
  if (suggestionText.value) {
    const currentMessage = newMessage.value;
    const cursorPos = textareaRef.value?.selectionStart ?? currentMessage.length;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    const textAfterCursor = currentMessage.substring(cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    const partialCommand = textBeforeCursor.substring(atIndex + 1);
    
    // Complete the command
    const fullCommand = partialCommand + suggestionText.value;
    newMessage.value = 
      currentMessage.substring(0, atIndex) + 
      `@${fullCommand}` + 
      textAfterCursor;
    
    // Move cursor after the completed command
    nextTick(() => {
      const newCursorPos = atIndex + fullCommand.length + 1; // +1 for @
      textareaRef.value?.focus();
      textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
      suggestionText.value = ""; // Clear suggestion
      
      // Add a space after the command if there isn't one already
      if (newMessage.value[newCursorPos] !== ' ') {
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
// Import Font Awesome if not globally included via Nuxt config
// @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

// Variables - consider moving these to a separate SCSS variables file
// and importing it, or using CSS custom properties for better Nuxt integration.
$primary-bg: #f4f7f6;
$container-bg: #ffffff;
$border-color: #e0e0e0;
$text-color: #333;
$input-bg: #ffffff;
$button-bg: #007bff;
$button-text: #ffffff;
$date-color: #888;
$suggestion-color: #cccccc;
$command-color: #007bff;

$task-color: #ffc107; // Amber
$spend-color: #dc3545; // Red
$event-color: #28a745; // Green
$default-color: #6c757d; // Gray

// Apply base styles globally (consider putting in nuxt.config or a global css file)
body {
  margin: 0;
  font-family: sans-serif;
  background-color: $primary-bg;
  min-height: 100vh;
  padding-top: 5vh; // Add some space at the top
}

// Scoped styles could be used if preferred, but these are mostly layout
.app-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.chat-container {
  width: 40%;
  min-width: 500px; // Minimum width for smaller screens
  background-color: $container-bg;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 80vh; // Fixed height for the container
  overflow: hidden; // Hide overflow from children
}

.chat-timeline {
  flex-grow: 1;
  overflow-y: auto; // Allow scrolling for timeline content
  padding: 20px;
  border-bottom: 1px solid $border-color;

  .date-separator {
    text-align: center;
    margin: 15px 0;
    color: $date-color;
    font-size: 0.9em;
    font-weight: bold;
  }

  .timeline-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15px;
    padding: 10px;
    border-radius: 5px;
    background-color: $primary-bg; // Slight background for items

    .item-icon {
      margin-right: 10px;
      font-size: 1.2em;
      width: 20px; // Fixed width for alignment
      text-align: center;
      // Font Awesome icons will be added here based on type
    }

    .item-content {
      flex-grow: 1;
      color: $text-color;
      word-wrap: break-word; // Ensure long words break
    }

    .item-timestamp {
      font-size: 0.8em;
      color: $date-color;
      margin-top: 5px;
      display: block; // Ensure it appears below content
    }

    // Type-specific styles
    &.item-task {
      border-left: 4px solid $task-color;
      .item-icon {
        color: $task-color;
      }
    }
    &.item-spend {
      border-left: 4px solid $spend-color;
      .item-icon {
        color: $spend-color;
      }
    }
    &.item-event {
      border-left: 4px solid $event-color;
      .item-icon {
        color: $event-color;
      }
    }
    &.item-default {
      border-left: 4px solid $default-color;
      .item-icon {
        color: $default-color;
      }
    }
  }
}

.chat-input-area {
  display: flex;
  padding: 15px;
  background-color: $primary-bg; // Match item background

  .input-wrapper {
    position: relative;
    flex-grow: 1;
    margin-right: 10px;
  }

  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid $border-color;
    border-radius: 4px;
    resize: none; // Prevent manual resizing
    font-family: inherit;
    font-size: 1em;
    min-height: 40px; // Minimum height
    max-height: 120px; // Maximum height before scrolling
    overflow-y: auto; // Allow scrolling if text exceeds max-height
  }

  .suggestion-overlay {
    position: absolute;
    top: 10px; // Match textarea padding
    pointer-events: none; // Allow clicks to pass through to textarea
    white-space: pre; // Preserve spaces
    
    .suggestion-text {
      color: $suggestion-color;
      font-family: inherit;
      font-size: 1em;
    }
  }

  button {
    padding: 10px 15px;
    background-color: $button-bg;
    color: $button-text;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1em;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: darken($button-bg, 10%);
    }
  }
}

// Style for completed commands in the textarea
// This requires a custom directive or component to apply styling to parts of text
// For now, we'll add this CSS that can be used with a future enhancement
.command-text {
  color: $command-color;
  font-weight: bold;
}
</style>
