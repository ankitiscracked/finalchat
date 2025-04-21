<template>
  <div class="app-container"> <!-- Added a wrapper for potential global layout -->
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
                <span class="item-timestamp">{{ formatTime(item.createdAt) }}</span>
              </div>
            </div>
          </div>
        </template>
        <!-- Show message if timeline is empty -->
        <p v-else-if="!timeline.length">Your timeline is empty. Add items below!</p>
        <!-- Keep loading text only initially -->
        <p v-else>Loading timeline...</p>
      </div>
      <div class="chat-input-area">
        <textarea
          id="chat-input"
          :placeholder="isDbReady ? 'Type your message or command (@task, @spend, @event)...' : 'Initializing database...'"
          v-model="newMessage"
          @keydown.meta.enter.prevent="submitMessage"
          @keydown.ctrl.enter.prevent="submitMessage"
          :disabled="!isDbReady"
        ></textarea>
        <button
          id="submit-button"
          @click="submitMessage"
          :disabled="!isDbReady"
        >
          {{ isDbReady ? 'Submit' : 'Loading...' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { getDb, type DbInstance } from '~/src/db/index'; // Import the getter function and type
import { timelineItems, type TimelineItem, type NewTimelineItem, type ItemType, itemTypes } from '~/src/db/schema'; // Adjusted path
import { desc, sql } from 'drizzle-orm';

// Define reactive refs
const newMessage = ref('');
const db = ref<DbInstance | null>(null); // Ref to hold the DB instance
const isDbReady = ref(false); // State to track DB initialization
const timeline = ref<TimelineItem[]>([]); // Typed timeline items
const chatTimelineRef = ref<HTMLElement | null>(null); // Ref for scrolling

// Helper function to parse message type and content
function parseMessage(message: string): { type: ItemType; content: string } {
  const trimmedMessage = message.trim();
  for (const type of itemTypes) {
    if (type === 'default') continue; // Skip default type check
    const prefix = `@${type} `;
    if (trimmedMessage.startsWith(prefix)) {
      return { type, content: trimmedMessage.substring(prefix.length) };
    }
  }
  // If no command prefix matches, treat as default message
  return { type: 'default', content: trimmedMessage };
}

// Helper function to format date
function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Helper function to format time
function formatTime(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Use true or false based on preference
    });
}

// Helper to get icon class based on type
function getIconClass(type: ItemType): string {
    switch (type) {
        case 'task': return 'fa-solid fa-list-check';
        case 'spend': return 'fa-solid fa-dollar-sign';
        case 'event': return 'fa-solid fa-calendar-day';
        default: return 'fa-solid fa-message';
    }
}

// Computed property to group timeline items by date
const groupedTimeline = computed(() => {
  const groups: Record<string, TimelineItem[]> = {};
  timeline.value.forEach(item => {
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

  const newItem: NewTimelineItem = {
    type: type,
    content: content,
    // createdAt will be set by default in the database
  };

  try {
    console.log('Saving item:', newItem);
    if (!db.value) {
      console.error("Database instance not available.");
      return;
    }
    await db.value.insert(timelineItems).values(newItem);
    console.log('Item saved successfully.');
    newMessage.value = ''; // Clear input
    await loadTimeline(); // Reload timeline to show the new item
  } catch (error) {
    console.error('Error saving timeline item:', error);
    // Optionally: Show an error message to the user
  }
};

const loadTimeline = async () => {
  if (!db.value) {
    console.error("Database instance not available for loading.");
    timeline.value = []; // Clear timeline if DB is not ready
    return;
  }
  console.log('Loading timeline from database...');
  try {
    // Fetch items, order by creation date ascending for correct display order
    const items = await db.value.select()
                          .from(timelineItems)
                          // Order by ID ascending as a proxy for creation time if defaultNow() precision varies
                          // Or rely on createdAt if precision is sufficient
                          .orderBy(timelineItems.id)
                          // .orderBy(asc(timelineItems.createdAt)) // Alternative if timestamps are reliable
                          // .limit(100); // Optional: Limit the number of items loaded
                          ;
    timeline.value = items;
    console.log(`Loaded ${items.length} items.`);
    await scrollToBottom(); // Scroll to bottom after loading
  } catch (error) {
    console.error('Error loading timeline items:', error);
    // Handle potential errors, e.g., table not found if migrations didn't run
    if (error instanceof Error && error.message.includes('no such table')) {
        console.warn("Timeline table not found. Ensure migrations have been applied.");
        // Optionally, attempt to run migration SQL here if feasible,
        // but ideally migrations are handled by drizzle-kit apply/push.
    }
    timeline.value = []; // Clear timeline on error
  }
};

// Load timeline when the component mounts client-side
onMounted(async () => {
  // PGlite/IndexedDB only works in the browser
  if (process.client) {
    try {
      console.log("Component mounted client-side, getting DB instance...");
      db.value = await getDb(); // Get the DB instance
      isDbReady.value = true; // Set DB ready state to true
      console.log("DB instance acquired, loading timeline...");
      await loadTimeline(); // Now load the timeline using the instance
    } catch (error) {
        console.error("Failed to initialize database:", error);
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

$task-color: #ffc107; // Amber
$spend-color: #dc3545; // Red
$event-color: #28a745; // Green
$default-color: #6c757d; // Gray

// Apply base styles globally (consider putting in nuxt.config or a global css file)
body {
    margin: 0;
    font-family: sans-serif;
    background-color: $primary-bg;
    display: flex; // Use flex on the body/app container if needed
    justify-content: center;
    align-items: flex-start; // Align to top
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
    min-width: 350px; // Minimum width for smaller screens
    max-width: 800px; // Maximum width
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
            .item-icon { color: $task-color; }
        }
        &.item-spend {
            border-left: 4px solid $spend-color;
            .item-icon { color: $spend-color; }
        }
        &.item-event {
            border-left: 4px solid $event-color;
            .item-icon { color: $event-color; }
        }
        &.item-default {
             border-left: 4px solid $default-color;
            .item-icon { color: $default-color; }
        }
    }
}

.chat-input-area {
    display: flex;
    padding: 15px;
    background-color: $primary-bg; // Match item background

    textarea {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid $border-color;
        border-radius: 4px;
        resize: none; // Prevent manual resizing
        margin-right: 10px;
        font-family: inherit;
        font-size: 1em;
        min-height: 40px; // Minimum height
        max-height: 120px; // Maximum height before scrolling
        overflow-y: auto; // Allow scrolling if text exceeds max-height
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
</style>
