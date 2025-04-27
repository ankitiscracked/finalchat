import { ref, watch, nextTick } from "vue";

export function useSuggestions(
  textareaRef: any,
  newMessage: any,
  commandTypes: string[],
  specialCommands: string[],
  currentOverviewType: any = ref("task") // Add overview type parameter with default
) {
  const suggestionText = ref("");

  // Command constraints mapping for contextual suggestions
  const commandConstraints = {
    'move-to': { allowedOverviewTypes: ['task'] },
    // Add more constrained commands here as needed
  };

  // Utility function to check if a command is available in the current context
  const isCommandAvailable = (command: string, overviewType: string): boolean => {
    const constraints = commandConstraints[command];
    return !constraints || constraints.allowedOverviewTypes.includes(overviewType);
  };

  const commandPatterns = {
    fullCommand: (commandName) => new RegExp(`^\\/${commandName}\\s+$`),
    partialCommand: (commandName) =>
      new RegExp(`^\\/${commandName}\\s+(\\w*)$`),
  };

  const isFullCommand = (textBeforeCursor, commandName) => {
    return textBeforeCursor.match(commandPatterns.fullCommand(commandName));
  };

  const isPartialCommand = (textBeforeCursor, commandName) => {
    return textBeforeCursor.match(commandPatterns.partialCommand(commandName));
  };

  // Watch for changes in the input message to update suggestion
  watch(newMessage, () => {
    updateSuggestion();
  });

  // Update the suggestion text based on current input and cursor position
  const updateSuggestion = () => {
    if (!textareaRef.value) return;

    const currentMessage = newMessage.value;
    const cursorPos = textareaRef.value.selectionStart;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    const textAfterCursor = currentMessage.substring(cursorPos);

    // Ensure there are no characters beyond the cursor position
    if (hasCharactersAfterCursor(textAfterCursor)) {
      clearSuggestion();
      return;
    }

    // --- SUGGESTION LOGIC FOR TASK COMMANDS ---
    // List of supported commands and their abbreviations
    const commandAbbreviations = [
      { full: "delete", abbr: "del" },
      { full: "move-to", abbr: "mov" },
      { full: "edit", abbr: "ed" },
      { full: "show", abbr: "sho" },
      { full: "ai-overview", abbr: "ai-ov" },
    ];

    for (const { full, abbr } of commandAbbreviations) {
      // Skip commands that aren't available in current context
      if (!isCommandAvailable(full, currentOverviewType.value)) continue;
      
      if (isFullCommand(textBeforeCursor, full) || isFullCommand(textBeforeCursor, abbr)) {
        suggestFirstCommandType();
        return;
      }
      if (isPartialCommand(textBeforeCursor, full) || isPartialCommand(textBeforeCursor, abbr)) {
        suggestMatchingCommandType(
          textBeforeCursor,
          commandPatterns.partialCommand(full)
        );
        return;
      }
    }

    if (isTypingCommand(textBeforeCursor, cursorPos)) {
      suggestMatchingCommandOrSpecialCommand(textBeforeCursor);
    } else {
      clearSuggestion();
    }
  };

  const hasCharactersAfterCursor = (textAfterCursor) =>
    textAfterCursor.trim() !== "";

  const clearSuggestion = () => {
    suggestionText.value = "";
  };

  const isTypingCommand = (textBeforeCursor, cursorPos) => {
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    const spaceAfterSlashIndex = textBeforeCursor.indexOf(" ", slashIndex);
    return (
      slashIndex !== -1 &&
      (spaceAfterSlashIndex === -1 || spaceAfterSlashIndex > cursorPos) &&
      !/\s/.test(textBeforeCursor.substring(slashIndex + 1))
    );
  };

  const suggestFirstCommandType = () => {
    suggestionText.value = commandTypes[0];
  };

  const suggestMatchingCommandType = (textBeforeCursor, regex) => {
    const match = textBeforeCursor.match(regex);
    if (match) {
      const partialType = match[1].toLowerCase();
      const matchingCommand = commandTypes.find(
        (cmd) => cmd.startsWith(partialType) && cmd !== partialType
      );
      suggestionText.value = matchingCommand
        ? matchingCommand.substring(partialType.length)
        : "";
    }
  };

  const suggestMatchingCommandOrSpecialCommand = (textBeforeCursor) => {
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    const partialCommand = textBeforeCursor
      .substring(slashIndex + 1)
      .toLowerCase();

    // Abbreviation support for task commands
    const abbrMap = {
      del: "delete",
      mov: "move-to",
      ed: "edit",
      sho: "show",
      "ai-ov": "ai-overview",
    };
    
    // If the user types an abbreviation, suggest the full command
    for (const abbr in abbrMap) {
      const fullCmd = abbrMap[abbr];
      // Skip commands that aren't available in current context
      if (!isCommandAvailable(fullCmd, currentOverviewType.value)) continue;
      
      if (partialCommand.startsWith(abbr) && fullCmd !== partialCommand) {
        suggestionText.value = fullCmd.substring(partialCommand.length);
        return;
      }
    }

    const matchingSpecialCommand = specialCommands.find(
      (cmd) => cmd.startsWith(partialCommand) && cmd !== partialCommand
    );

    if (matchingSpecialCommand) {
      suggestionText.value = matchingSpecialCommand.substring(
        partialCommand.length
      );
      return;
    }

    // Filter available commands based on current context
    const availableCommands = commandTypes.filter(cmd => 
      isCommandAvailable(cmd, currentOverviewType.value)
    );

    const matchingCommand = availableCommands.find(
      (cmd) => cmd.startsWith(partialCommand) && cmd !== partialCommand
    );

    suggestionText.value = matchingCommand
      ? matchingCommand.substring(partialCommand.length)
      : "";
  };

  // Complete the command when Tab is pressed
  const completeCommand = () => {
    if (suggestionText.value) {
      const currentMessage = newMessage.value;
      const cursorPos =
        textareaRef.value?.selectionStart ?? currentMessage.length;
      const textBeforeCursor = currentMessage.substring(0, cursorPos);
      const textAfterCursor = currentMessage.substring(cursorPos);

      // Ensure there are no characters beyond the cursor position
      if (textAfterCursor.trim() !== "") {
        return;
      }

      // Handle /show command completion
      const showMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
      if (showMatch) {
        const partialType = showMatch[1];
        const fullType = partialType + suggestionText.value;

        newMessage.value = "/show " + fullType + textAfterCursor;

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

        newMessage.value = "/ai-overview " + fullType + textAfterCursor;

        nextTick(() => {
          const newCursorPos = "/ai-overview ".length + fullType.length;
          textareaRef.value?.focus();
          textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
          suggestionText.value = "";
        });
        return;
      }

      // Check if it's a special command (like close-overview)
      const specialCommandMatch = specialCommands.find(
        (cmd) =>
          textBeforeCursor ===
          `/${cmd.substring(0, cmd.length - suggestionText.value.length)}`
      );

      if (specialCommandMatch) {
        // Complete the special command
        newMessage.value = `/${specialCommandMatch}` + textAfterCursor;

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
        if (
          newMessage.value[newCursorPos] !== " " &&
          !specialCommands.includes(fullCommand as any)
        ) {
          newMessage.value =
            newMessage.value.substring(0, newCursorPos) +
            " " +
            newMessage.value.substring(newCursorPos);

          // Move cursor after the space
          nextTick(() => {
            textareaRef.value?.setSelectionRange(
              newCursorPos + 1,
              newCursorPos + 1
            );
          });
        }
      });
    }
  };

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

  return {
    suggestionText,
    updateSuggestion,
    completeCommand,
    getTypedPart,
    commandConstraints, // Export constraints for potential external usage
  };
}
