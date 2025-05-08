import { assign, setup } from "xstate";

const commandPattern = /^\/([a-z0-9-]*)$/;
const commandWithArgPattern = /^\/([a-z0-9-]+)\s+([a-z0-9-]*)$/;

// Context interface
interface CommandMachineContext {
  inputText: string;
  cursorPosition: number;
  textBeforeCursor: string;
  textAfterCursor: string;
  suggestionText: string;
  suggestedCommands: string[];
  selectedSuggestionIndex: number;
  commandPrefixMap: Map<string, { commands: string[]; isUnique: boolean }>;
  currentCommand: string;
  currentCommandArg: string;
  commandNames: string[];
  overviewType: string;
  projectPopoverOpen: boolean;
  selectedProject: { id: number; name: string } | null;
}

// Events
type CommandMachineEvent =
  | { type: "TEXT_CHANGED"; text: string; cursorPosition: number }
  | { type: "KEY_PRESSED"; key: "Tab" | "Escape" | "Enter" | "Cmd + Enter" }
  | { type: "CURSOR_MOVED"; position: number }
  | { type: "PROJECT_SELECTED"; project: { id: number; name: string } }
  | { type: "COLLECTION_SELECTED"; collection: { id: number; name: string } }
  | { type: "COMMAND_EXECUTED" }
  | { type: "POPOVER_CLOSED" };

export const commandMachine = setup({
  types: {
    events: {} as CommandMachineEvent,
    context: {} as CommandMachineContext,
    input: {} as {
      commandNames: string[];
      commandPrefixMap: Map<string, { commands: string[]; isUnique: boolean }>;
      overviewType: string;
    },
  },
  actions: {
    updateInputText: assign({
      inputText: ({ context, event }) => {
        console.log("updateInputText - Context:", context, "Event:", event);
        return event.type === "TEXT_CHANGED" ? event.text : "";
      },
      cursorPosition: ({ context, event }) => {
        console.log("updateInputText - Context:", context, "Event:", event);
        return event.type === "TEXT_CHANGED" ? event.cursorPosition : 0;
      },
      textBeforeCursor: ({ context, event }) => {
        console.log("updateInputText - Context:", context, "Event:", event);
        return event.type === "TEXT_CHANGED"
          ? event.text.substring(0, event.cursorPosition)
          : "";
      },
      textAfterCursor: ({ context, event }) => {
        console.log("updateInputText - Context:", context, "Event:", event);
        return event.type === "TEXT_CHANGED"
          ? event.text.substring(event.cursorPosition)
          : "";
      },
    }),
    updateCursorPosition: assign({
      cursorPosition: ({ context, event }) => {
        console.log(
          "updateCursorPosition - Context:",
          context,
          "Event:",
          event
        );
        return event.type === "CURSOR_MOVED" ? event.position : 0;
      },
      textBeforeCursor: ({ context, event }) => {
        console.log(
          "updateCursorPosition - Context:",
          context,
          "Event:",
          event
        );
        return event.type === "CURSOR_MOVED"
          ? context.inputText.substring(0, event.position)
          : context.textBeforeCursor;
      },
      textAfterCursor: ({ context, event }) => {
        console.log(
          "updateCursorPosition - Context:",
          context,
          "Event:",
          event
        );
        return event.type === "CURSOR_MOVED"
          ? context.inputText.substring(event.position)
          : context.textAfterCursor;
      },
    }),
    clearSuggestions: assign({
      suggestionText: ({ context, event }) => {
        console.log("clearSuggestions - Context:", context, "Event:", event);
        return "";
      },
      suggestedCommands: ({ context, event }) => {
        console.log("clearSuggestions - Context:", context, "Event:", event);
        return [];
      },
    }),
    updateSuggestion: assign({
      suggestionText: ({ context }) => {
        console.log("updateSuggestion - Context:", context);
        const entry = getMatchingCommandEntry(context);
        if (entry && entry.isUnique) {
          return entry.commands[0].substring(
            context.textBeforeCursor.length - 1
          );
        }
        return "";
      },
      suggestedCommands: ({ context }) => {
        console.log("updateSuggestion - Context:", context);
        const entry = getMatchingCommandEntry(context);
        if (entry && !entry.isUnique) {
          return entry.commands;
        }
        return [];
      },
    }),
    updateArgSuggestion: assign({
      suggestionText: ({ context }) => {
        console.log("updateArgSuggestion - Context:", context);
        const match = context.textBeforeCursor.match(commandWithArgPattern);

        const command = match![1].toLocaleLowerCase();
        const arg = match![2].toLocaleLowerCase();

        if (command === "show") {
          return getMatchingItemType(arg, context) ?? "";
        }
        return "";
      },
    }),
    updateSuggestionIndex: assign({
      selectedSuggestionIndex: ({ context }) => {
        console.log("updateSuggestionIndex - Context:", context);
        const nextIndex =
          (context.selectedSuggestionIndex + 1) %
          context.suggestedCommands.length;
        return nextIndex;
      },
    }),
    prepareCompletion: assign({
      // Prepare the completion by setting up necessary context
      inputText: ({ context, event }) => {
        console.log("prepareCompletion - Context:", context, "Event:", event);
        return context.inputText;
      },
    }),
    completeCommand: assign({
      inputText: ({ context }) => {
        console.log("completeCommand - Context:", context);
        let inputText = context.inputText;

        const commandMatch = context.textBeforeCursor.match(commandPattern);
        if (commandMatch) {
          let fullCommand;
          if (context.suggestedCommands.length > 0) {
            fullCommand =
              context.suggestedCommands[context.selectedSuggestionIndex];
          } else {
            const partialCommand = commandMatch[1];
            fullCommand = partialCommand + context.suggestionText;
          }

          inputText = `/${fullCommand}`;
          if (!["show", "projects", "tasks-in"].includes(fullCommand)) {
            inputText += " ";
          }
        }
        const argMatch = context.textBeforeCursor.match(commandWithArgPattern);
        if (argMatch) {
          const command = argMatch[1];
          const partialArg = argMatch[2];
          const fullArg = partialArg + context.suggestionText;

          inputText = `/${command} ${fullArg}`;
        }

        return inputText;
      },
    }),
    moveCursorPosition: assign({
      cursorPosition: ({ context }) => {
        console.log("updateCursorPosition - Context:", context);
        return context.inputText.length;
      },
    }),
    updateTextBeforeCursor: assign({
      textBeforeCursor: ({ context }) => {
        console.log("updateTextBeforeCursor - Context:", context);
        return context.inputText;
      },
    }),
    insertProject: assign({
      selectedProject: ({ context, event }) => {
        console.log("insertProject - Context:", context, "Event:", event);
        const typedEvent = event as { type: "PROJECT_SELECTED"; project: any };
        return typedEvent.project;
      },
      inputText: ({ context }) => {
        console.log("insertProject - Context:", context);
        let inputText = context.inputText;
        const project = context.selectedProject;
        inputText = inputText + ` ${project!.name}`;

        return inputText;
      },
    }),
    closeProjectPopover: () => {
      console.log("closeProjectPopover");
      // Implementation would close the project popover
    },
    executeCommand: ({ context }) => {
      console.log("executeCommand - Context:", context);
      // Implementation would execute the command in inputText
    },
  },
  guards: {
    isCommandPattern: ({ context }) => {
      // Check if textBeforeCursor matches command pattern
      return (
        !context.textAfterCursor.trim() &&
        commandPattern.test(context.textBeforeCursor)
      );
    },
    isCommandWithArgPattern: ({ context }) => {
      // Check if textBeforeCursor matches command pattern
      return (
        !context.textAfterCursor.trim() &&
        commandWithArgPattern.test(context.textBeforeCursor)
      );
    },
  },
}).createMachine({
  id: "commandMachine",
  initial: "idle",
  context: ({ input }) =>
    ({
      inputText: "",
      cursorPosition: 0,
      textBeforeCursor: "",
      textAfterCursor: "",
      suggestionText: "",
      suggestedCommands: [],
      selectedSuggestionIndex: -1,
      currentCommand: "",
      currentCommandArg: "",
      commandNames: input.commandNames,
      commandPrefixMap: input.commandPrefixMap,
      overviewType: input.overviewType,
      projectPopoverOpen: false,
      selectedProject: null,
    } as CommandMachineContext),
  states: {
    idle: {
      on: {
        TEXT_CHANGED: {
          target: "typing",
          actions: "updateInputText",
        },
      },
    },
    typing: {
      entry: "clearSuggestions",
      on: {
        TEXT_CHANGED: {
          target: "suggesting",
          actions: "updateInputText",
          guard: "isCommandPattern",
        },
        CURSOR_MOVED: {
          target: "suggesting",
          actions: "updateCursorPosition",
          guard: "isCommandPattern",
        },
        KEY_PRESSED: [
          {
            target: "idle",
            guard: ({ event }) => event.key === "Cmd + Enter",
          },
        ],
      },
    },
    suggesting: {
      entry: "updateSuggestion",
      on: {
        TEXT_CHANGED: {
          target: "suggesting",
          actions: "updateInputText",
          reenter: true,
        },
        CURSOR_MOVED: {
          target: "suggesting",
          actions: "updateCursorPosition",
        },
        KEY_PRESSED: [
          {
            target: "completing",
            guard: ({ context, event }) =>
              event.key === "Tab" && context.suggestionText !== "",
            actions: "prepareCompletion",
          },
          {
            target: "suggesting",
            guard: ({ context, event }) =>
              event.key === "Tab" && context.suggestedCommands.length > 0,
            actions: "updateSuggestionIndex",
          },
          {
            target: "completing",
            guard: ({ context, event }) =>
              event.key === "Enter" && context.suggestedCommands.length > 0,
            actions: [{ type: "moveCursorPosition" }],
          },
          {
            target: "completing",
            guard: ({ context, event }) =>
              event.key === "Enter" && context.projectPopoverOpen,
          },
          {
            target: "idle",
            guard: ({ event }) => event.key === "Escape",
            actions: "clearSuggestions",
          },
          {
            target: "idle",
            guard: ({ event }) => event.key === "Cmd + Enter",
          },
          {
            target: "projectSelection",
            guard: ({ context, event }) =>
              event.key === "Tab" &&
              context.currentCommand === "projects || tasks-in",
          },
        ],
      },
    },
    completing: {
      entry: "completeCommand",
      always: {
        target: "suggesting",
        actions: [
          { type: "moveCursorPosition" },
          { type: "updateTextBeforeCursor" },
        ],
      },
    },
    projectSelection: {
      entry: assign({
        projectPopoverOpen: true,
      }),
      on: {
        PROJECT_SELECTED: {
          target: "completing",
          actions: [{ type: "insertProject" }, { type: "moveCursorPosition" }],
        },
        KEY_PRESSED: {
          target: "suggesting",
          guard: ({ event }) => event.key === "Escape",
          actions: assign({
            projectPopoverOpen: false,
          }),
        },
        POPOVER_CLOSED: {
          target: "suggesting",
          actions: assign({
            projectPopoverOpen: false,
          }),
        },
      },
    },
  },
});

function getMatchingCommandEntry(context: CommandMachineContext) {
  const commandMatch = context.textBeforeCursor.match(commandPattern);
  const partialCommand = commandMatch![1].toLowerCase();

  if (partialCommand && context.commandPrefixMap.has(partialCommand)) {
    return context.commandPrefixMap.get(partialCommand)!;
  }
}

const getMatchingItemType = (
  partialType: string,
  context: CommandMachineContext
) => {
  if (!partialType) {
    // Simply suggest the first command type if nothing typed yet
    return context.commandNames[0];
  }

  // Find a matching command type
  const matchingType = context.commandNames.find(
    (type) => type.startsWith(partialType) && type !== partialType
  );

  if (matchingType) {
    return matchingType.substring(partialType.length);
  }
};

const getMatchingCommand = (
  partialCommand: string,
  context: CommandMachineContext
) => {
  if (!partialCommand) {
    const availableCommands = context.commandNames.filter((cmd) =>
      isCommandAvailable(cmd, context.overviewType)
    );
    if (availableCommands.length > 0) {
      return availableCommands[0];
    }
  }

  if (context.commandPrefixMap.has(partialCommand)) {
    const entry = context.commandPrefixMap.get(partialCommand)!;

    // If this prefix uniquely identifies a command, suggest the rest of it
    if (entry.isUnique) {
      const fullCommand = entry.commands[0];
      return fullCommand.substring(partialCommand.length);
    }
  }
};

// Utility function to check if a command is available in the current context
const isCommandAvailable = (command: string, overviewType: string): boolean => {
  const constraints = commandConstraints[command];
  return (
    !constraints || constraints.allowedOverviewTypes.includes(overviewType)
  );
};
