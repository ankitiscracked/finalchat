import { ref } from 'vue';

export function useCommands() {
  // Define item types
  const allItemTypes = ["task", "spend", "event", "note", "default"] as const;
  type ItemType = (typeof allItemTypes)[number];
  
  // Filter out 'default' for command suggestions
  const commandTypes = allItemTypes.filter((t) => t !== "default");

  // Define special commands
  const specialCommands = ["show", "close-overview", "ai-overview"] as const;
  type SpecialCommand = (typeof specialCommands)[number];
  
  // State for overview
  const showOverview = ref(false);
  const overviewType = ref("task");
  const overviewMode = ref<"standard" | "ai">("standard");
  
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
        return true;
      }
    }
    return false;
  }
  
  // Handle /close-overview command
  function handleCloseOverviewCommand(message: string): boolean {
    if (message.trim() === '/close-overview') {
      showOverview.value = false;
      return true;
    }
    return false;
  }
  
  // Handle /ai-overview command
  function handleAiOverviewCommand(message: string): boolean {
    const aiOverviewRegex = /^\/ai-overview\s+(\w+)\s*$/;
    const match = message.match(aiOverviewRegex);
    
    if (match) {
      const type = match[1];
      if (commandTypes.includes(type as ItemType)) {
        overviewType.value = type;
        overviewMode.value = "ai";
        showOverview.value = true;
        return true;
      }
    }
    return false;
  }
  
  return {
    allItemTypes,
    commandTypes,
    specialCommands,
    showOverview,
    overviewType,
    overviewMode,
    parseMessage,
    handleShowCommand,
    handleCloseOverviewCommand,
    handleAiOverviewCommand
  };
}