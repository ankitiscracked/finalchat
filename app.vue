<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>
<template>
  <div class="app-container"> <!-- Added a wrapper for potential global layout -->
    <div class="chat-container">
      <div class="chat-timeline" id="chat-timeline">
        <!-- Timeline items will be loaded here -->
        <p>Timeline loading...</p> <!-- Placeholder -->
      </div>
      <div class="chat-input-area">
        <textarea
          id="chat-input"
          placeholder="Type your message or command (@task, @spend, @event)..."
          v-model="newMessage"
          @keydown.meta.enter.prevent="submitMessage"
          @keydown.ctrl.enter.prevent="submitMessage"
        ></textarea>
        <button id="submit-button" @click="submitMessage">Submit</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
// We will import DB functions and types here later
// import { db } from '~/src/db'; // Example path, adjust as needed
// import { timelineItems, type NewTimelineItem, type ItemType } from '~/src/db/schema';
// import { desc } from 'drizzle-orm';

const newMessage = ref('');
const timeline = ref([]); // Placeholder for timeline items

const submitMessage = () => {
  if (!newMessage.value.trim()) return;
  console.log('Submitting:', newMessage.value);
  // TODO: Process message (check for commands), save to DB, update timeline
  newMessage.value = ''; // Clear input
};

const loadTimeline = async () => {
  console.log('Loading timeline...');
  // TODO: Fetch items from DB and populate timeline ref
  // Example:
  // const items = await db.select().from(timelineItems).orderBy(desc(timelineItems.createdAt)).limit(50);
  // timeline.value = items; // Need processing for display (group by date, etc.)
};

// Load timeline when the component mounts
onMounted(() => {
  // PGlite needs to run client-side
  if (process.client) {
    loadTimeline();
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
