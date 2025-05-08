import { el, tr } from "@nuxt/ui/runtime/locale/index.js";
import { ref, watch, nextTick, type Ref } from "vue";

interface PrefixEntry {
  commands: string[];
  isUnique: boolean;
}

export function useSuggestions(newMessage: Ref<string>) {
  const { commandNames, overviewType, showProjectPopover } = useCommands();
  const { chatInputTextAreaRef: textareaRef } = useGlobalElementAffordances();
  const suggestionText = ref("");
  const suggestedCommands = ref<string[]>([]);
  const commandSupportsTabCompletion = ref(false);
  const selectedsuggestionIndex = ref(-1);

  const textBeforeCursor = computed(() => {
    if (!textareaRef.value) return "";
    const cursorPos = textareaRef.value.selectionStart;
    return newMessage.value.substring(0, cursorPos);
  });

  const textAfterCursor = computed(() => {
    if (!textareaRef.value) return "";
    const cursorPos = textareaRef.value.selectionStart;
    return newMessage.value.substring(cursorPos);
  });

  const commandPattern = /^\/([a-z0-9-]*)$/;
  const commandWithArgPattern = /^\/([a-z0-9-]+)\s+([a-z0-9-]*)$/;

  // Command constraints mapping for contextual suggestions
  const commandConstraints: Record<string, { allowedOverviewTypes: string[] }> =
    {
      "move-to": { allowedOverviewTypes: ["task"] },
      // Add more constrained commands here as needed
    };

  // Define available task states
  const taskStates = ["todo", "in-progress", "done"];

  // Build command prefix map
  const prefixMap = new Map<string, PrefixEntry>();
  const buildPrefixMap = () => {
    // Clear the map
    prefixMap.clear();

    // Get available commands based on current context
    const availableCommands = commandNames.filter((cmd) =>
      isCommandAvailable(cmd, overviewType.value)
    );

    // Add all command prefixes to the map
    availableCommands.forEach((command) => {
      // Add prefixes for the full command
      for (let i = 1; i <= command.length; i++) {
        const prefix = command.substring(0, i);
        addToPrefixMap(prefix, command);
      }
    });

    // Update uniqueness flags in the map
    for (const [prefix, entry] of prefixMap.entries()) {
      entry.isUnique = entry.commands.length === 1;
    }
  };

  // Helper function to add a command to the prefix map
  const addToPrefixMap = (prefix: string, command: string) => {
    if (!prefixMap.has(prefix)) {
      prefixMap.set(prefix, { commands: [], isUnique: false });
    }

    const entry = prefixMap.get(prefix)!;
    if (!entry.commands.includes(command)) {
      entry.commands.push(command);
    }
  };

  // Build task state prefix map
  const statesPrefixMap = new Map<string, PrefixEntry>();
  const buildStatesPrefixMap = () => {
    // Clear the map
    statesPrefixMap.clear();

    // Add all state prefixes to the map
    taskStates.forEach((state) => {
      for (let i = 1; i <= state.length; i++) {
        const prefix = state.substring(0, i);

        if (!statesPrefixMap.has(prefix)) {
          statesPrefixMap.set(prefix, { commands: [], isUnique: false });
        }

        const entry = statesPrefixMap.get(prefix)!;
        if (!entry.commands.includes(state)) {
          entry.commands.push(state);
        }
      }
    });

    // Update uniqueness flags in the map
    for (const [prefix, entry] of statesPrefixMap.entries()) {
      entry.isUnique = entry.commands.length === 1;
    }
  };

  // Utility function to check if a command is available in the current context
  const isCommandAvailable = (
    command: string,
    overviewType: string
  ): boolean => {
    const constraints = commandConstraints[command];
    return (
      !constraints || constraints.allowedOverviewTypes.includes(overviewType)
    );
  };

  onMounted(() => {
    // Initialize prefix maps
    buildPrefixMap();
    buildStatesPrefixMap();
  });

  // Watch for changes in overview type to rebuild the prefix map
  watch(overviewType, () => {
    buildPrefixMap();
  });

  // Watch for changes in the input message to update suggestion
  watch(newMessage, () => {
    updateSuggestion();
  });

  // Update the suggestion text based on current input and cursor position
  const updateSuggestion = () => {
    // Ensure there are no characters beyond the cursor position
    if (textAfterCursor.value.trim() !== "") {
      clearSuggestion();
      return;
    }

    // Handle /command pattern
    const commandMatch = textBeforeCursor.value.match(commandPattern);
    if (commandMatch) {
      const partialCommand = commandMatch[1].toLowerCase();
      suggestMatchingCommand(partialCommand);
      return;
    }

    // Handle /command arg pattern
    const argMatch = textBeforeCursor.value.match(commandWithArgPattern);
    if (argMatch) {
      const command = argMatch[1].toLowerCase();
      const partialArg = argMatch[2].toLowerCase();

      // Special case for move-to command with argument
      if (command === "move-to") {
        suggestMatchingTaskState(partialArg);
        return;
      }

      // Handle other commands with arguments
      if (["show", "ai-overview"].includes(command)) {
        suggestMatchingCommandType(partialArg);
        return;
      }
    }

    clearSuggestion();
  };

  const clearSuggestion = () => {
    suggestionText.value = "";
    suggestedCommands.value = [];
  };

  // Suggest a matching command based on partial input
  const suggestMatchingCommand = (partialCommand: string) => {
    if (!partialCommand) {
      // Simply suggest the first available command if nothing typed yet
      const availableCommands = commandNames.filter((cmd) =>
        isCommandAvailable(cmd, overviewType.value)
      );
      if (availableCommands.length > 0) {
        suggestionText.value = availableCommands[0];
      }
      return;
    }

    // Check if this partial command exists in our prefix map
    if (prefixMap.has(partialCommand)) {
      const entry = prefixMap.get(partialCommand)!;

      // If this prefix uniquely identifies a command, suggest the rest of it
      if (entry.isUnique) {
        const fullCommand = entry.commands[0];
        suggestionText.value = fullCommand.substring(partialCommand.length);
      } else {
        suggestedCommands.value = entry.commands;
      }
    } else {
      clearSuggestion();
    }
  };

  // Suggest a matching task state based on partial input
  const suggestMatchingTaskState = (partialState: string) => {
    if (!partialState) {
      // Simply suggest the first task state if nothing typed yet
      suggestionText.value = taskStates[0];
      return;
    }

    // Check if this partial state exists in our prefix map
    if (statesPrefixMap.has(partialState)) {
      const entry = statesPrefixMap.get(partialState)!;

      // If this prefix uniquely identifies a state, suggest the rest of it
      if (entry.isUnique) {
        const fullState = entry.commands[0];
        suggestionText.value = fullState.substring(partialState.length);
      }
    } else {
      clearSuggestion();
    }
  };

  // Suggest a matching command type for commands like /show or /ai-overview
  const suggestMatchingCommandType = (partialType: string) => {
    if (!partialType) {
      // Simply suggest the first command type if nothing typed yet
      suggestionText.value = commandNames[0];
      return;
    }

    // Find a matching command type
    const matchingType = commandNames.find(
      (type) => type.startsWith(partialType) && type !== partialType
    );

    if (matchingType) {
      suggestionText.value = matchingType.substring(partialType.length);
    } else {
      clearSuggestion();
    }
  };

  // Complete the command when Tab is pressed
  const completeCommand = () => {
    if (suggestedCommands.value.length > 0) {
      selectedsuggestionIndex.value =
        (selectedsuggestionIndex.value + 1) % suggestedCommands.value.length;
    }

    if (suggestionText.value || commandSupportsTabCompletion.value) {
      // Ensure there are no characters beyond the cursor position
      if (textAfterCursor.value.trim() !== "") {
        return;
      }

      // Handle /command pattern
      const commandMatch = textBeforeCursor.value.match(commandPattern);
      if (commandMatch) {
        const partialCommand = commandMatch[1];
        const fullCommand = partialCommand + suggestionText.value;

        // Complete the command
        newMessage.value = `/${fullCommand}`;

        // Move cursor after the completed command
        nextTick(() => {
          const newCursorPos = fullCommand.length + 1; // +1 for /
          textareaRef.value?.focus();
          textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
          suggestionText.value = "";

          // Add a space after the command if it's not a special command
          if (!["show", "ai-overview"].includes(fullCommand as any)) {
            newMessage.value =
              newMessage.value.substring(0, newCursorPos) + " ";

            if (["projects", "tasks-in"].includes(fullCommand)) {
              if (commandSupportsTabCompletion.value) {
                showProjectPopover.value = true;
              } else {
                commandSupportsTabCompletion.value = true;
              }
            } else {
              commandSupportsTabCompletion.value = false;
            }

            // Move cursor after the space
            nextTick(() => {
              textareaRef.value?.setSelectionRange(
                newCursorPos + 1,
                newCursorPos + 1
              );
            });
          }
        });

        return;
      }

      // Handle /command arg pattern
      const argMatch = textBeforeCursor.value.match(commandWithArgPattern);
      if (argMatch) {
        const command = argMatch[1];

        const partialArg = argMatch[2];
        const fullArg = partialArg + suggestionText.value;

        // Complete the command with argument
        newMessage.value = `/${command} ${fullArg}${textAfterCursor.value}`;

        // Move cursor after the completed command with argument
        nextTick(() => {
          const newCursorPos = command.length + fullArg.length + 2; // +2 for / and space
          textareaRef.value?.focus();
          textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
          suggestionText.value = "";
        });
      }
    }
  };

  return {
    suggestionText,
    updateSuggestion,
    completeCommand,
    textBeforeCursor,
    commandConstraints,
    taskStates,
    suggestedCommands,
    selectedsuggestionIndex,
    prefixMap,
  };
}
