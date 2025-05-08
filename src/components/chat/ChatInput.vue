<template>
  <div class="mt-4 flex gap-4 items-center">
    <div class="flex flex-col w-full">
      <div
        class="flex gap-4 border border-gray-200 rounded-sm px-2 py-1"
        v-if="context.suggestedCommands.length > 0"
      >
        <span
          v-for="(command, index) in context.suggestedCommands"
          :key="index"
        >
          <span
            class="text-xs px-1 py-0.5 rounded-sm border"
            :class="[
              index === context.selectedSuggestionIndex
                ? 'text-orange-600  bg-orange-100 border-orange-400'
                : 'text-stone-500 border-stone-300',
            ]"
            @click.prevent.stop="send({ type: 'KEY_PRESSED', key: 'Enter' })"
          >
            {{ command }}
          </span>
        </span>
      </div>

      <div class="relative flex w-full">
        <textarea
          class="flex-1 p-2 border border-gray-300 rounded-sm resize-none outline-none text-sm min-h-[64px]"
          :ref="(el) => setGlobalElementRef(el as HTMLElement, 'chatInputTextArea')"
          id="chat-input"
          :placeholder="
            props.isDbReady
              ? 'Type your message or command...'
              : 'Initializing database...'
          "
          v-model="newMessage"
          @keydown.meta.enter.prevent="
            send({ type: 'KEY_PRESSED', key: 'Cmd + Enter' })
          "
          @keydown.ctrl.enter.prevent="
            send({ type: 'KEY_PRESSED', key: 'Cmd + Enter' })
          "
          @keydown.tab.prevent="send({ type: 'KEY_PRESSED', key: 'Tab' })"
          @keydown.enter.prevent="send({ type: 'KEY_PRESSED', key: 'Enter' })"
          @keydown="handleKeyDown"
          @input="handleInput"
          :disabled="!props.isDbReady"
        ></textarea>

        <div
          v-if="context.suggestionText"
          class="absolute top-[6px] left-[9px] pointer-events-none"
        >
          <span class="text-sm">{{ context.textBeforeCursor }}</span
          ><span class="text-stone-400 text-sm">{{
            context.suggestionText
          }}</span>
          <div
            class="text-[10px] border border-stone-200 p-0.5 rounded-sm mt-1 text-stone-600"
          >
            hit Tab to complete
          </div>
        </div>

        <!-- Project Popover -->
        <ProjectPopover />
      </div>
    </div>

    <button
      id="submit-button"
      @click="submitMessage"
      :disabled="!props.isDbReady"
      class="p-2 bg-orange-600 text-white rounded-sm hover:bg-orange-700 transition-colors duration-200"
    >
      Send
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMachine } from "@xstate/vue";
import { ref } from "vue";

const { setGlobalElementRef, chatInputTextAreaRef } =
  useGlobalElementAffordances();
const props = defineProps<{
  isDbReady: boolean;
}>();

// Get task operations from composable
const { executeCommand, messageIsCommand, commandNames, overviewType } =
  useCommands();
const { createNote } = useNotes();

const newMessage = ref("");

// Extract suggestion handling from composable
const { suggestionText, updateSuggestion, prefixMap } =
  useSuggestions(newMessage);

const { snapshot, send } = useMachine(commandMachine, {
  input: {
    commandNames: commandNames,
    commandPrefixMap: prefixMap,
    overviewType: overviewType.value,
  },
});

const context = computed(() => {
  return snapshot.value.context;
});

watch(
  context,
  (updatedContext) => {
    console.log("Updated context:", updatedContext);
    console.log("snapshot:", snapshot.value.value);
    newMessage.value = updatedContext.inputText;
    const { cursorPosition } = updatedContext;
    chatInputTextAreaRef.value!.setSelectionRange(
      cursorPosition,
      cursorPosition
    );
    chatInputTextAreaRef.value!.focus();
  },
  { deep: true }
);

// Handle keyboard events
const handleKeyDown = (event: KeyboardEvent) => {
  // Update suggestion on any key press
  updateSuggestion();

  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    send({
      type: "CURSOR_MOVED",
      position: chatInputTextAreaRef.value!.selectionStart,
    });
  }

  // Handle special keys if needed
  if (event.key === "Escape" && suggestionText.value) {
    send({
      type: "KEY_PRESSED",
      key: "Escape",
    });
  }
};

// Handle input event (when text changes)
const handleInput = (event: Event) => {
  console.log("Input event triggered");
  send({
    type: "TEXT_CHANGED",
    text: newMessage.value,
    cursorPosition: chatInputTextAreaRef.value!.selectionStart,
  });
  // checkForProjectTag();
  // checkForCollectionTag();
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
    send({
      type: "KEY_PRESSED",
      key: "Cmd + Enter",
    });
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
