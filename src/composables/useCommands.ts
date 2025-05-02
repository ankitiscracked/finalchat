import { ref } from "vue";

export function useCommands() {
  const { selectedItemIds } = useGlobalContext();
  // Define item types
  const { createTask } = useTasks();
  const { createEvent } = useEvents();
  // Define item types for the command registry

  // State for overview and canvas
  const showOverview = useState(() => false);
  const overviewType = useState<ItemType>("overviewType", () => "task");
  const overviewMode = useState<OverviewType>("overviewMode", () => "standard");
  const showCanvas = ref(false);

  // Define command categories
  enum CommandType {
    ITEM_CREATION, // Commands that create items (/task, /event)
    ITEM_ACTION, // Commands that act on selected items (/delete, /move-to, /edit)
    SYSTEM_TOGGLE, // Commands that toggle UI state (/show, /close-overview, /canvas)
    SYSTEM_ACTION, // Commands that trigger system actions (/ai-overview)
  }

  // Command definition interface
  interface Command {
    name: string;
    type: CommandType;
    pattern: RegExp;
    extractParams: (input: string) => Record<string, any>;
    execute: (params: Record<string, any>, selectedItemIds?: number[]) => any;
  }

  // Command registry
  const commands: Command[] = [
    // Item creation commands
    {
      name: "task",
      type: CommandType.ITEM_CREATION,
      pattern: /^\/task\s+(.+)$/,
      extractParams: (input) => ({ content: input.replace(/^\/task\s+/, "") }),
      execute: async ({ content }) => await createTask(content),
    },
    {
      name: "event",
      type: CommandType.ITEM_CREATION,
      pattern: /^\/event\s+(.+)$/,
      extractParams: (input) => ({ content: input.replace(/^\/event\s+/, "") }),
      execute: async ({ content }) => await createEvent(content),
    },

    // Item action commands
    {
      name: "delete",
      type: CommandType.ITEM_ACTION,
      pattern: /^\/delete$/,
      extractParams: () => ({}),
      execute: ({}, selectedItemIds) => ({ type: "delete", content: "" }),
    },
    {
      name: "move-to",
      type: CommandType.ITEM_ACTION,
      pattern: /^\/move-to\s+(.+)$/,
      extractParams: (input) => {
        const match = input.match(/^\/move-to\s+(.+)$/);
        return { target: match ? match[1] : "" };
      },
      execute: ({ target }, selectedItemIds) => ({
        type: "move-to",
        content: target,
      }),
    },
    // System toggle commands
    {
      name: "show",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/show\s+(\w+)\s*$/,
      extractParams: (input) => {
        const match = input.match(/^\/show\s+(\w+)\s*$/);
        return { itemType: match ? match[1] : null };
      },
      execute: ({ itemType }) => {
        if (allItemTypes.includes(itemType)) {
          overviewType.value = itemType;
          showOverview.value = true;
          return {
            success: true,
            activateTaskFocus: itemType === "task",
          };
        }
        return { success: false };
      },
    },
    {
      name: "close-overview",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/close-overview\s*$/,
      extractParams: () => ({}),
      execute: () => {
        showOverview.value = false;
        return { success: true };
      },
    },
    {
      name: "canvas",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/canvas\s*$/,
      extractParams: () => ({}),
      execute: () => {
        showCanvas.value = true;
        return { success: true };
      },
    },
    {
      name: "close-canvas",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/close-canvas\s*$/,
      extractParams: () => ({}),
      execute: () => {
        showCanvas.value = false;
        return { success: true };
      },
    },

    // System action commands
    {
      name: "ai-overview",
      type: CommandType.SYSTEM_ACTION,
      pattern: /^\/ai-overview\s+(\w+)\s*$/,
      extractParams: (input) => {
        const match = input.match(/^\/ai-overview\s+(\w+)\s*$/);
        return { itemType: match ? match[1] : null };
      },
      execute: ({ itemType }) => {
        if (allItemTypes.includes(itemType)) {
          overviewType.value = itemType;
          overviewMode.value = "ai";
          showOverview.value = true;
          return { success: true };
        }
        return { success: false };
      },
    },
  ];

  const commandNames = commands.map((command) => command.name);

  // Parse a message into a type and content using the command registry
  function executeCommand(message: string): {
    type: ItemType;
    content: string;
  } {
    const trimmedMessage = message.trim();

    // Find matching command in registry
    for (const command of commands) {
      if (command.pattern.test(trimmedMessage)) {
        const params = command.extractParams(trimmedMessage);
        if (command.type === CommandType.ITEM_ACTION) {
          command.execute(params, selectedItemIds.value);
        } else {
          command.execute(params);
        }
      }
    }

    // If no command matches, treat as a note
    return { type: "note", content: trimmedMessage };
  }

  function messageIsCommand(message: string): boolean {
    const trimmedMessage = message.trim();
    return commands.some((command) => command.pattern.test(trimmedMessage));
  }

  // Handle /show command - maintaining backward compatibility
  function handleShowCommand(message: string) {
    const command = commands.find((cmd) => cmd.name === "show");
    if (command && command.pattern.test(message.trim())) {
      const params = command.extractParams(message.trim());
      return command.execute(params);
    }
    return { success: false };
  }

  // Handle /close-overview command - maintaining backward compatibility
  function handleCloseOverviewCommand(message: string): { success: boolean } {
    const command = commands.find((cmd) => cmd.name === "close-overview");
    if (command && command.pattern.test(message.trim())) {
      return command.execute({});
    }
    return { success: false };
  }

  // Handle /ai-overview command - maintaining backward compatibility
  function handleAiOverviewCommand(message: string): { success: boolean } {
    const command = commands.find((cmd) => cmd.name === "ai-overview");
    if (command && command.pattern.test(message.trim())) {
      const params = command.extractParams(message.trim());
      return command.execute(params);
    }
    return { success: false };
  }

  // Handle /canvas command - maintaining backward compatibility
  function handleCanvasCommand(message: string): { success: boolean } {
    const command = commands.find((cmd) => cmd.name === "canvas");
    if (command && command.pattern.test(message.trim())) {
      return command.execute({});
    }
    return { success: false };
  }

  // Handle /close-canvas command - maintaining backward compatibility
  function handleCloseCanvasCommand(message: string): { success: boolean } {
    const command = commands.find((cmd) => cmd.name === "close-canvas");
    if (command && command.pattern.test(message.trim())) {
      return command.execute({});
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
    showOverview,
    overviewType,
    overviewMode,
    showCanvas,
    executeCommand,
    handleShowCommand,
    handleCloseOverviewCommand,
    handleAiOverviewCommand,
    handleCanvasCommand,
    handleCloseCanvasCommand,
    shouldShowSuggestions,
    handleTabKey,
    messageIsCommand,
    commandNames,
  };
}
