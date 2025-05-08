import { ref } from "vue";
import {
  type ItemType,
  type OverviewMode,
  type OverviewType,
} from "~/utils/constants";

export function useCommands() {
  const { selectedItemIds } = useGlobalContext();
  const { showCommandsDrawer } = useGlobalElementAffordances();
  // Define item types
  const { createTask } = useTasks();
  const { createEvent } = useEvents();
  const { createProject } = useProjects("");
  // Define item types for the command registry

  const toast = useToast();
  // Get week tasks functionality
  const { showWeekTasks, toggleWeekTasksView } = useWeekTasks();

  // State for overview and canvas
  const showOverview = useState(() => false);
  const overviewType = useState<OverviewType>(
    "overviewType",
    () => "item-list"
  );
  const itemTypeToShow = useState<ItemType>("itemTypeToShow", () => "task");
  const overviewMode = useState<OverviewMode>("overviewMode", () => "standard");
  const showCanvas = ref(false);
  const showProjectPopover = useState("showProjectPopover", () => false);

  // Define command categories
  enum CommandType {
    ITEM_CREATION, // Commands that create items (/task, /event)
    ITEM_ACTION, // Commands that act on selected items (/delete, /move-to, /edit)
    SYSTEM_TOGGLE, // Commands that toggle UI state (/show, /close-overview, /canvas)
    SYSTEM_ACTION, // Commands that trigger system actions (/ai-overview)
    WEEK_VIEW_ACTION, // Commands for week view (/week-tasks, /mon, /tue, etc.)
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
        if (itemType === "task") {
          showOverview.value = true;
          overviewType.value = "upcoming-tasks";
        } else {
          showOverview.value = true;
          overviewType.value = "item-list";
          itemTypeToShow.value = itemType;
        }
      },
    },
    {
      name: "projects",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/projects\s+(\w+)\s*$/,
      extractParams: (input) => {
        const match = input.match(/^\/projects\s+(\w+)\s*$/);
        return { itemType: match ? match[1] : null };
      },
      execute: ({ project }) => {
        console.log("project selected:", project);
      },
    },
    {
      name: "tasks-in",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/tasks-in\s+(\w+)\s*$/,
      extractParams: (input) => {
        const match = input.match(/^\/tasks-in\s+(\w+)\s*$/);
        return { itemType: match ? match[1] : null };
      },
      execute: ({ project }) => {
        console.log("project selected:", project);
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

    // Week view commands
    {
      name: "week-tasks",
      type: CommandType.WEEK_VIEW_ACTION,
      pattern: /^\/week-tasks\s*$/,
      extractParams: () => ({}),
      execute: () => {
        // Hide other views first
        showCanvas.value = false;
        showOverview.value = true;
        overviewType.value = "week-tasks";
      },
    },
    {
      name: "close-week-tasks",
      type: CommandType.WEEK_VIEW_ACTION,
      pattern: /^\/close-week-tasks\s*$/,
      extractParams: () => ({}),
      execute: () => {
        toggleWeekTasksView(false);
        return { success: true };
      },
    },
    {
      name: "help",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/help\s*$/,
      extractParams: () => ({}),
      execute: () => {
        showCommandsDrawer.value = true;
      },
    },
    {
      name: "unscheduled-tasks",
      type: CommandType.SYSTEM_TOGGLE,
      pattern: /^\/unscheduled-tasks\s*$/,
      extractParams: () => ({}),
      execute: () => {
        showOverview.value = true;
        overviewType.value = "unscheduled-tasks";
      },
    },
    {
      name: "add-project",
      type: CommandType.ITEM_CREATION,
      pattern: /^\/add-project\s+(.+)$/,
      extractParams: (input) => {
        const match = input.match(/^\/add-project\s+(.+)$/);
        return { projectName: match ? match[1] : "" };
      },
      execute: async ({ projectName }) => {
        // Logic to add a project
        console.log("Project added:", projectName);
        await createProject(projectName);
        toast.add({
          title: `Project "${projectName}" created successfully!`,
        });
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
    itemTypeToShow,
    showCanvas,
    showWeekTasks,
    executeCommand,
    shouldShowSuggestions,
    handleTabKey,
    messageIsCommand,
    commandNames,
    showProjectPopover,
  };
}
