<template>
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
        @input="handleInput"
        :disabled="!isDbReady"
      ></textarea>
      <div 
        v-if="suggestionText" 
        class="suggestion-overlay"
      >
        <span class="typed-part">{{ getTypedPart() }}</span><span class="suggestion-part">{{ suggestionText }}</span>
        <div class="suggestion-hint">hit Tab to complete</div>
      </div>
      
      <!-- Project Popover -->
      <ProjectPopover
        v-if="showProjectPopover"
        :position="projectPopoverPosition"
        @close="closeProjectPopover"
        @select="selectProject"
        @create="selectProject"
      />
      
      <!-- Collection Popover -->
      <CollectionPopover
        v-if="showCollectionPopover"
        :position="collectionPopoverPosition"
        @close="closeCollectionPopover"
        @select="selectCollection"
        @create="selectCollection"
      />
    </div>
    <button
      id="submit-button"
      @click="submitMessage"
      :disabled="!isDbReady"
    >
      <i class="ph-bold ph-paper-plane-right"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import ProjectPopover from '../project/ProjectPopover.vue';
import CollectionPopover from '../collection/CollectionPopover.vue';
import { useSuggestions } from '../../composables/useSuggestions';
import { useProjects } from '../../composables/useProjects';
import { useCollections } from '../../composables/useCollections';
import { submitTimelineItem } from '../../services/timelineService';

const props = defineProps<{
  isDbReady: boolean;
  commandTypes: string[];
  specialCommands: string[];
  parseMessage: (message: string) => { type: string; content: string };
  handleSpecialCommands: (message: string) => boolean;
}>();

const emit = defineEmits<{
  (e: 'message-submitted'): void;
}>();

// Refs
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const newMessage = ref("");
const messageCounter = ref(0);
const currentDateOffset = ref(0);

// Extract project handling from composable
const {
  showProjectPopover,
  projectPopoverPosition,
  currentProject,
  projects,
  checkForProjectTag,
  closeProjectPopover,
  selectProject,
  extractProjectFromContent: extractProject
} = useProjects(textareaRef, newMessage);

// Extract collection handling from composable
const {
  showCollectionPopover,
  collectionPopoverPosition,
  currentCollection,
  collections,
  checkForCollectionTag,
  closeCollectionPopover,
  selectCollection,
  extractCollectionFromContent: extractCollection
} = useCollections(textareaRef, newMessage);

// Extract suggestion handling from composable
const {
  suggestionText,
  updateSuggestion,
  completeCommand,
  getTypedPart
} = useSuggestions(textareaRef, newMessage, props.commandTypes, props.specialCommands);

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  // Update suggestion on any key press
  updateSuggestion();
  
  // Handle special keys if needed
  if (event.key === 'Escape' && suggestionText.value) {
    event.preventDefault();
    suggestionText.value = "";
  }
  
  // If it's the # key, check for project tag immediately (don't wait for input event)
  if (event.key === '#') {
    console.log("# key pressed");
    // Use nextTick to let the character appear in the textarea first
    nextTick(() => {
      checkForProjectTag();
    });
  }
  
  // If it's the @ key, check for collection tag immediately
  if (event.key === '@') {
    console.log("@ key pressed");
    // Use nextTick to let the character appear in the textarea first
    nextTick(() => {
      checkForCollectionTag();
    });
  }
};

// Handle input event (when text changes)
const handleInput = (event: Event) => {
  console.log("Input event triggered");
  checkForProjectTag();
  checkForCollectionTag();
};

// Submit a message
const submitMessage = async () => {
  const messageText = newMessage.value.trim();
  if (!messageText) return;

  // Check if it's a special command
  if (props.handleSpecialCommands(messageText)) {
    newMessage.value = ""; // Clear input
    return;
  }

  const { type, content } = props.parseMessage(messageText);

  if (!content) {
    console.warn("Cannot submit empty content after command.");
    return; // Don't submit if only command was typed
  }
  
  // Check for project in task content
  let cleanContent = content;
  let projectId: number | undefined = undefined;
  let collectionId: number | undefined = undefined;
  
  // Extract project from the content if it's a task
  if (type === 'task') {
    // Look for "in #project-name" pattern at the end
    const projectMatch = content.match(/\s+in\s+#(\S+)$/i);
    if (projectMatch && projectMatch[1]) {
      const projectName = projectMatch[1];
      
      // Find project by name
      const project = projects.value.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (project) {
        projectId = project.id;
        // Remove the project tag from the content
        cleanContent = content.substring(0, content.length - projectMatch[0].length).trim();
      }
    }
  }
  
  // Extract collection from the content if it's a note or event
  if (type === 'event' || type === 'note' || type === 'default') {
    // Look for "in @collection-name" pattern at the end
    const collectionMatch = cleanContent.match(/\s+in\s+@(\S+)$/i);
    if (collectionMatch && collectionMatch[1]) {
      const collectionName = collectionMatch[1];
      
      // Find collection by name
      const collection = collections.value.find(c => c.name.toLowerCase() === collectionName.toLowerCase());
      if (collection) {
        collectionId = collection.id;
        // Remove the collection tag from the content
        cleanContent = cleanContent.substring(0, cleanContent.length - collectionMatch[0].length).trim();
      }
    }
  }

  try {
    console.log("Saving item to IndexedDB:", { type, content: cleanContent, projectId });
    
    // Increment message counter
    messageCounter.value++;
    
    // Increment date offset every 5 messages
    if (messageCounter.value % 5 === 0) {
      currentDateOffset.value++;
    }
    
    // Submit through the service
    await submitTimelineItem(
      type, 
      cleanContent, 
      projectId,
      collectionId, 
      currentDateOffset.value
    );
    
    console.log("Item saved successfully.");
    newMessage.value = ""; // Clear input
    currentProject.value = null; // Reset current project
    currentCollection.value = null; // Reset current collection
    
    // Notify parent that message was submitted
    emit('message-submitted');
  } catch (error) {
    console.error("Error saving timeline item to IndexedDB:", error);
    // Optionally: Show an error message to the user
  }
};
</script>

<style lang="scss" scoped>
@import "../../../styles/main.scss";

// App theme colors
$border-color: $gray-300;
$accent-color: $orange-500;
$accent-dark: $orange-700;
$suggestion-color: $gray-400;

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
</style>