<template>
  <div class="chat-input-area">
    <div class="input-wrapper">
      <textarea
        :ref="(el) => setGlobalElementRef(el as HTMLElement, 'chatInputTextArea')"
        id="chat-input"
        :placeholder="
          props.isDbReady
            ? isEditing
              ? 'Edit task and press Enter/Esc...'
              : 'Type your message or command...'
            : 'Initializing database...'
        "
        v-model="newMessage"
        @keydown.meta.enter.prevent="submitMessage"
        @keydown.ctrl.enter.prevent="submitMessage"
        @keydown.tab.prevent="completeCommand"
        @keydown="handleKeyDown"
        @input="handleInput"
        :disabled="!props.isDbReady"
      ></textarea>

      <div v-if="suggestionText" class="suggestion-overlay">
        <span class="typed-part">{{ getTypedPart() }}</span
        ><span class="suggestion-part">{{ suggestionText }}</span>
        <div class="suggestion-hint">hit Tab to complete</div>
      </div>

      <div v-if="isEditing" class="editing-chip">
        Editing task... (Press Enter to save, Esc to cancel)
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
      :disabled="!props.isDbReady"
    >
      Send
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { useTaskOperations } from "../../composables/useTaskOperations";

const { setGlobalElementRef } = useGlobalElementAffordances();
const props = defineProps<{
  isDbReady: boolean;
}>();

const {
  handleShowCommand,
  handleCloseOverviewCommand,
  handleAiOverviewCommand,
  handleCanvasCommand,
  handleCloseCanvasCommand,
  handleWeekTasksCommand,
  handleCloseWeekTasksCommand,
  handleDayCommand,
} = useCommands();
// Get task operations from composable
const { deleteSelectedTasks, editTask, moveTasks } = useTaskOperations();
const { executeCommand, messageIsCommand } = useCommands();
const { selectedTaskIds, focusState } = useTaskSelection();
const focusedTaskId = computed(() => focusState.value.currentTaskId);
const { createNote } = useNotes();

const newMessage = ref("");

// Extract project handling from composable
const {
  showProjectPopover,
  projectPopoverPosition,
  checkForProjectTag,
  closeProjectPopover,
  selectProject,
} = useProjects(newMessage);

// Extract collection handling from composable
const {
  showCollectionPopover,
  collectionPopoverPosition,
  checkForCollectionTag,
  closeCollectionPopover,
  selectCollection,
} = useCollections(newMessage);

// Extract suggestion handling from composable
const {
  suggestionText,
  updateSuggestion,
  completeCommand,
  getTypedPart,
  taskStates,
} = useSuggestions(newMessage);

// Editing state
const isEditing = ref(false);
const editingTaskId = ref<number | null>(null);

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  // Update suggestion on any key press
  updateSuggestion();

  // Handle special keys if needed
  if (event.key === "Escape" && suggestionText.value) {
    event.preventDefault();
    suggestionText.value = "";
  }

  // If it's the # key, check for project tag immediately (don't wait for input event)
  if (event.key === "#") {
    console.log("# key pressed");
    // Use nextTick to let the character appear in the textarea first
    nextTick(() => {
      checkForProjectTag();
    });
  }

  // If it's the @ key, check for collection tag immediately
  if (event.key === "@") {
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

// Handle commands
const submitMessage = async () => {
  try {
    const messageText = newMessage.value.trim();
    if (!messageText) return;

    if (messageIsCommand(messageText)) {
      executeCommand(messageText);
      newMessage.value = "";
      return;
    }

    // otherwise, submit the message as a new note
    const note = await createNote(messageText);
    if (note) {
      newMessage.value = "";
    }
  } catch (error) {
    console.error("Error submitting message:", error);
  }
};
</script>

<style lang="scss" scoped>
// App theme colors
$border-color: $gray-300;
$accent-color: $orange-500;
$accent-dark: $orange-900;
$suggestion-color: $gray-400;

.chat-input-area {
  margin-top: 15px;
  display: flex;
  gap: 8px;
  align-items: center;

  .input-wrapper {
    position: relative;
    width: 100%;
    display: flex;
  }

  textarea {
    flex-grow: 1;
    width: 100%;
    padding: 12px 15px;
    border: 0px solid $border-color;
    border-radius: 4px;
    resize: none; // Prevent manual resizing
    font-family: "Inter", sans-serif;
    font-size: 0.95rem;
    min-height: 48px; // Minimum height
    max-height: 120px; // Maximum height before scrolling
    overflow-y: auto; // Allow scrolling if text exceeds max-height
    transition: border-color 0.2s ease;
    box-shadow: var(--tw-shadow-color, #00000026) 0px 1px 2px 0px inset,
      var(--tw-shadow-color, #00000014) 1px -2px 2px 0px inset;

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
      font-family: "Inter", sans-serif;
      font-size: 0.95rem;
    }

    .suggestion-part {
      color: $suggestion-color;
      font-family: "Inter", sans-serif;
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
    // width: 48px;
    // height: 48px;
    padding: 12px 16px;
    background-color: #ff4a00;
    color: $white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
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
