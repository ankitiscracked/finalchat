<template>
  <div class="chat-input-area">
    <div class="input-wrapper">
      <textarea
        :ref="(el) => setGlobalElementRef(el, 'chatInputTextArea')"
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
} = useCommands();
const { activateTaskFocus } = useFocusable();

// Get task operations from composable
const { deleteSelectedTasks, editTask, moveTasks } = useTaskOperations();
const { parseMessage } = useCommands();
const { selectedTaskIds, focusState } = useTaskSelection();
const focusedTaskId = computed(() => focusState.value.currentTaskId);

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
  const messageText = newMessage.value.trim();
  if (!messageText) return;

  if (handleSpecialCommands(messageText)) {
    newMessage.value = "";
    return;
  }

  const { type, content } = parseMessage(messageText);

  if (!content && type !== "edit" && type !== "delete") {
    console.warn("Cannot submit empty content after command.");
    return;
  }

  switch (type) {
    case "delete":
      deleteSelectedTasks();
      newMessage.value = "";
      break;

    case "move-to":
      // Check if the content (state) is valid
      if (!content) {
        console.warn("No state specified for move-to command");
        return;
      }

      // Verify if it's one of the valid states
      if (!taskStates.includes(content)) {
        console.warn(`Invalid task state: ${content}`);
        return;
      }

      if (
        selectedTaskIds.value &&
        selectedTaskIds.value.length > 0 &&
        focusedTaskId.value !== null
      ) {
        moveTasks({
          selectedTasks: selectedTaskIds.value,
          currentTaskId: focusedTaskId.value,
          newState: content,
        });
        // Clear the input after successful command
        newMessage.value = "";
      } else {
        console.warn("No tasks selected to move");
      }
      break;

    // case "edit":
    //   if (isEditing.value) {
    //     if (editingTaskId.value !== null) {
    //       editTask({
    //         taskId: editingTaskId.value,
    //         newContent: messageText,
    //       });
    //       isEditing.value = false;
    //       editingTaskId.value = null;
    //       newMessage.value = "";
    //     }
    //   } else {
    //     if (props.focusedTaskId !== null) {
    //       isEditing.value = true;
    //       editingTaskId.value = props.focusedTaskId;
    //       newMessage.value = content;
    //     } else {
    //       console.warn("No task selected for editing.");
    //     }
    //   }
    //   break;
  }
  // ...existing logic...
};

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
          activateTaskFocus();
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
