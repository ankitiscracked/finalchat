import { ref, nextTick } from "vue";
import type { ProjectRecord } from "../services/indexedDB";
import {
  loadProjects,
  createProject,
  findProjectByName,
} from "../services/projectService";

export function useProjects(newMessage: any) {
  const { chatInputTextAreaRef: textareaRef } = useGlobalElementAffordances();
  const showProjectPopover = ref(false);
  const projectPopoverPosition = ref<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const currentProject = ref<ProjectRecord | null>(null);
  const projects = ref<ProjectRecord[]>([]);

  // Load projects from database
  const loadProjectsData = async () => {
    try {
      projects.value = await loadProjects();
      console.log(`Loaded ${projects.value.length} projects`);
    } catch (error) {
      console.error("Error loading projects:", error);
      projects.value = [];
    }
  };

  // Function to check for project tags in input
  const checkForProjectTag = () => {
    if (!textareaRef) {
      console.log("checkForProjectTag: textareaRef is null");
      return;
    }

    const message = newMessage.value;
    const cursorPos = textareaRef.value!.selectionStart;

    console.log("checkForProjectTag called:", {
      message,
      cursorPos,
      isTaskCmd: /^\/task\s+/i.test(message),
    });

    // Check if we're typing within a task command - look at the text before cursor
    // This is more reliable than checking the entire message
    const textBeforeCursor = message.substring(0, cursorPos);
    const isTaskCommand = /^\/task\s+/i.test(textBeforeCursor);

    console.log("Task command check:", {
      textBeforeCursor,
      isTaskCommand,
    });

    if (!isTaskCommand) {
      console.log("Not in a task command");
      if (showProjectPopover.value) {
        closeProjectPopover();
      }
      return;
    }

    // Look for # character before cursor position
    const hashIndex = textBeforeCursor.lastIndexOf("#");

    console.log("Hash check:", {
      hashIndex,
      textBeforeCursor,
      popoverVisible: showProjectPopover.value,
    });

    if (hashIndex !== -1 && !showProjectPopover.value) {
      // Make sure the # is not part of another word
      const charBeforeHash =
        hashIndex > 0 ? textBeforeCursor[hashIndex - 1] : "";
      const isValidHashPosition =
        charBeforeHash === "" || /\s/.test(charBeforeHash);

      console.log("Hash validation:", {
        charBeforeHash,
        isValidHashPosition,
      });

      if (isValidHashPosition) {
        // Position the popover next to the # character
        calculatePopoverPosition(hashIndex);
        showProjectPopover.value = true;
        console.log("Popover shown", {
          position: projectPopoverPosition.value,
        });
      }
    } else if (hashIndex === -1 && showProjectPopover.value) {
      // Close popover if there's no # anymore
      console.log("No # found, closing popover");
      closeProjectPopover();
    }
  };

  // Calculate popover position based on cursor position
  const calculatePopoverPosition = (hashIndex: number) => {
    if (!textareaRef.value) return;

    // Create a hidden div to measure text width
    const measureDiv = document.createElement("div");
    measureDiv.style.position = "absolute";
    measureDiv.style.visibility = "hidden";
    measureDiv.style.whiteSpace = "pre";
    measureDiv.style.fontSize = window.getComputedStyle(
      textareaRef.value
    ).fontSize;
    measureDiv.style.fontFamily = window.getComputedStyle(
      textareaRef.value
    ).fontFamily;
    measureDiv.style.letterSpacing = window.getComputedStyle(
      textareaRef.value
    ).letterSpacing;

    // Measure text width up to the hash character
    measureDiv.textContent = newMessage.value.substring(0, hashIndex);
    document.body.appendChild(measureDiv);

    // Get coordinates
    const textareaRect = textareaRef.value.getBoundingClientRect();
    const textWidth = measureDiv.offsetWidth;

    // Calculate line height and line breaks
    const lineHeight = parseInt(
      window.getComputedStyle(textareaRef.value).lineHeight
    );
    const offsetLeft = Math.min(textWidth, textareaRef.value.clientWidth - 280); // Prevent overflow

    // Clean up
    document.body.removeChild(measureDiv);

    // Get line height for better positioning

    // Update popover position - position it above cursor position with some padding
    projectPopoverPosition.value = {
      top: textareaRect.top - 5 - lineHeight, // Position just above cursor line
      left: textareaRect.left + offsetLeft, // Align with cursor
    };
  };

  // Close project popover
  const closeProjectPopover = () => {
    showProjectPopover.value = false;
  };

  // Handle project selection
  const selectProject = async (project: ProjectRecord) => {
    if (!textareaRef.value) return;

    // Store the selected project
    currentProject.value = project;

    // Update projects list if it's a new project
    if (!projects.value.some((p) => p.id === project.id)) {
      projects.value.push(project);
    }

    // Close the popover
    closeProjectPopover();

    // First, check if there's already a project tag in the message
    const message = newMessage.value;
    const existingProjectMatch = message.match(/\s+in\s+#\S+$/i);

    if (existingProjectMatch) {
      // If there's already a project tag, replace it with the new one
      newMessage.value =
        message
          .substring(0, message.length - existingProjectMatch[0].length)
          .trim() +
        " in #" +
        project.name;
    } else {
      // If no existing project, find the hashtag the user was typing
      const cursorPos = textareaRef.value.selectionStart;
      const textBeforeCursor = message.substring(0, cursorPos);
      const hashIndex = textBeforeCursor.lastIndexOf("#");

      if (hashIndex !== -1) {
        // Remove partial project tag (#something)
        const textAfterHash = message.substring(hashIndex);
        const spaceIndex = textAfterHash.search(/\s/);
        const endOfHashWord =
          spaceIndex !== -1 ? hashIndex + spaceIndex : message.length;

        // Get the cleaned message without the partial project tag
        const cleanedMessage =
          message.substring(0, hashIndex) +
          (spaceIndex !== -1 ? message.substring(endOfHashWord) : "");

        // Append project at the end
        newMessage.value = cleanedMessage.trim() + " in #" + project.name;
      } else {
        // Just append to the end if no # was found
        newMessage.value = message.trim() + " in #" + project.name;
      }
    }

    // Focus back to input and place cursor at the end
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus();
        // Place cursor at the end of the input
        textareaRef.value.selectionStart = textareaRef.value.value.length;
        textareaRef.value.selectionEnd = textareaRef.value.value.length;
      }
    });
  };

  // Extract project from task content
  const extractProjectFromContent = (
    content: string
  ): { cleanContent: string; projectId?: number } => {
    let cleanContent = content;
    let projectId: number | undefined = undefined;

    // Look for "in #project-name" pattern at the end
    const projectMatch = content.match(/\s+in\s+#(\S+)$/i);
    if (projectMatch && projectMatch[1]) {
      const projectName = projectMatch[1];

      // Find project by name
      const project = findProjectByName(projects.value, projectName);
      if (project) {
        projectId = project.id;
        // Remove the project tag from the content
        cleanContent = content
          .substring(0, content.length - projectMatch[0].length)
          .trim();
      }
    }

    return { cleanContent, projectId };
  };

  // Create and select a new project
  const createAndSelectProject = async (name: string) => {
    try {
      const newProject = await createProject(name);
      selectProject(newProject);
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  return {
    showProjectPopover,
    projectPopoverPosition,
    currentProject,
    projects,
    loadProjectsData,
    checkForProjectTag,
    closeProjectPopover,
    selectProject,
    extractProjectFromContent,
    createAndSelectProject,
  };
}
