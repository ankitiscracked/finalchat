<template>
  <div class="chat-input-area">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        id="chat-input"
        :placeholder="
          isDbReady
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
        :disabled="!isDbReady"
      ></textarea>
      <div v-if="suggestionText" class="suggestion-overlay">
        <span class="typed-part">{{ getTypedPart() }}</span
        ><span class="suggestion-part">{{ suggestionText }}</span>
        <div class="suggestion-hint">hit Tab to complete</div>
      </div>
      <div v-if="isEditing" class="editing-chip">
        Editing task... (Press Enter to save, Esc to cancel)
      </div>
      <div v-if="showMoveToStateInput" class="move-to-state-chip">
        Move to state:
        <select v-model="moveToState">
          <option
            v-for="state in moveToStateOptions"
            :key="state"
            :value="state"
          >
            {{ state }}
          </option>
        </select>
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

    <button id="submit-button" @click="submitMessage" :disabled="!isDbReady">
      Send
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
const props = defineProps<{
  isDbReady: boolean;
  commandTypes: string[];
  specialCommands: string[];
  parseMessage: (message: string) => { type: string; content: string };
  handleSpecialCommands: (message: string) => boolean;
  timelineItems: TimelineItemRecord[];
  overviewType: string;
  selectedTasks: number[];
  focusedTaskId: number | null;
  focusActive: boolean;
}>();

const emit = defineEmits<{
  (e: "message-submitted"): void;
  (e: "delete-tasks"): void;
  (
    e: "move-tasks",
    payload: { selectedTasks: any[]; currentTaskId: number; newState: string }
  ): void;
  (e: "edit-task", payload: { taskId: number; newContent: string }): void;
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
  extractProjectFromContent: extractProject,
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
  extractCollectionFromContent: extractCollection,
} = useCollections(textareaRef, newMessage);

// Extract suggestion handling from composable
const { suggestionText, updateSuggestion, completeCommand, getTypedPart } =
  useSuggestions(
    textareaRef,
    newMessage,
    props.commandTypes,
    props.specialCommands,
    computed(() => props.overviewType) // Pass current overview type
  );

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
  const messageText = newMessage.value.trim();
  if (!messageText) return;

  if (props.handleSpecialCommands(messageText)) {
    newMessage.value = "";
    return;
  }

  const { type, content } = props.parseMessage(messageText);

  if (!content && type !== "edit") {
    console.warn("Cannot submit empty content after command.");
    return;
  }

  switch (type) {
    case "delete":
      emit("delete-tasks");
      break;

    case "move-to":
      if (
        props.selectedTasks &&
        props.selectedTasks.length > 0 &&
        props.focusedTaskId !== null
      ) {
        emit("move-tasks", {
          selectedTasks: props.selectedTasks,
          currentTaskId: props.focusedTaskId as number,
          newState: content,
        });
      }
      break;

    case "edit":
      if (isEditing.value) {
        if (editingTaskId.value !== null) {
          emit("edit-task", {
            taskId: editingTaskId.value,
            newContent: messageText,
          });
          isEditing.value = false;
          editingTaskId.value = null;
          newMessage.value = "";
        }
      } else {
        if (props.focusedTaskId !== null) {
          isEditing.value = true;
          editingTaskId.value = props.focusedTaskId;
          newMessage.value = content;
        } else {
          console.warn("No task selected for editing.");
        }
      }
      break;
  }
  // ...existing logic...
};

function getAllStates() {
  // You may want to fetch this from a config or constant
  return ["todo", "in-progress", "done", "archived"];
}

function handleTaskCommand(command: string) {
  newMessage.value = command;
  submitMessage();
}

const editingChip = computed(() => {
  return isEditing.value
    ? "Editing task... (Press Enter to save, Esc to cancel)"
    : "";
});
</script>

<style lang="scss" scoped>
@import "../../styles/main.scss";

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
