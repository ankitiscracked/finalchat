import { ref } from "vue";

export function useCommands() {
  // Define item types
  const allItemTypes = ["task", "spend", "event", "note", "default"] as const;
  type ItemType = (typeof allItemTypes)[number];

  // Filter out 'default' for command suggestions
  const commandTypes = allItemTypes.filter((t) => t !== "default");

  // Define special commands
  const specialCommands = [
    "show",
    "close-overview",
    "ai-overview",
    "canvas",
    "close-canvas",
  ] as const;
  type SpecialCommand = (typeof specialCommands)[number];

  // State for overview and canvas
  const showOverview = ref(false);
  const overviewType = ref("task");
  const overviewMode = ref<"standard" | "ai">("standard");
  const showCanvas = ref(false);

  // Parse a message into a type and content
  function parseMessage(message: string): { type: ItemType; content: string } {
    const trimmedMessage = message.trim();
    // Use commandTypes for parsing prefixes
    for (const type of commandTypes) {
      const prefix = `/${type} `;
      if (trimmedMessage.startsWith(prefix)) {
        return { type, content: trimmedMessage.substring(prefix.length) };
      }
    }
    // If no command prefix matches, treat as a note
    return { type: "note", content: trimmedMessage };
  }

  // Handle /show command
  function handleShowCommand(message: string): boolean {
    const showRegex = /^\/show\s+(\w+)\s*$/;
    const match = message.match(showRegex);

    if (match) {
      const type = match[1];
      if (commandTypes.includes(type as ItemType)) {
        overviewType.value = type;
        showOverview.value = true;

        // Special handling for tasks to enable focus
        const shouldActivateTaskFocus = type === "task";
        return { success: true, activateTaskFocus: shouldActivateTaskFocus };
      }
    }
    return { success: false };
  }

  // Handle /close-overview command
  function handleCloseOverviewCommand(message: string): { success: boolean } {
    if (message.trim() === "/close-overview") {
      showOverview.value = false;
      return { success: true };
    }
    return { success: false };
  }

  // Handle /ai-overview command
  function handleAiOverviewCommand(message: string): { success: boolean } {
    const aiOverviewRegex = /^\/ai-overview\s+(\w+)\s*$/;
    const match = message.match(aiOverviewRegex);

    if (match) {
      const type = match[1];
      if (commandTypes.includes(type as ItemType)) {
        overviewType.value = type;
        overviewMode.value = "ai";
        showOverview.value = true;
        return { success: true };
      }
    }
    return { success: false };
  }

  // Handle /canvas command
  function handleCanvasCommand(message: string): { success: boolean } {
    if (message.trim() === "/canvas") {
      showCanvas.value = true;
      return { success: true };
    }
    return { success: false };
  }

  // Handle /close-canvas command
  function handleCloseCanvasCommand(message: string): { success: boolean } {
    if (message.trim() === "/close-canvas") {
      showCanvas.value = false;
      return { success: true };
    }
    return { success: false };
  }

  // Check if suggestions should be shown
  function shouldShowSuggestions(
    message: string,
    cursorPosition: number
  ): boolean {
    // Ensure there are no letters or non-whitespace characters beyond the cursor position
    return message.slice(cursorPosition).trim() === "";
  }

  // Complete the command when Tab is pressed
  function handleTabKey(
    message: string,
    cursorPosition: number
  ): { success: boolean } {
    if (shouldShowSuggestions(message, cursorPosition)) {
      // Logic to complete the command (e.g., apply suggestion)
      // This is a placeholder for the actual implementation
      return { success: true };
    }
    return { success: false };
  }

  return {
    allItemTypes,
    commandTypes,
    specialCommands,
    showOverview,
    overviewType,
    overviewMode,
    showCanvas,
    parseMessage,
    handleShowCommand,
    handleCloseOverviewCommand,
    handleAiOverviewCommand,
    handleCanvasCommand,
    handleCloseCanvasCommand,
    shouldShowSuggestions,
    handleTabKey,
  };
}
