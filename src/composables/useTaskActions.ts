import { ref, computed, type Ref } from "vue";
import type { TimelineItemRecord } from "../services/indexedDB";
import { updateItem, deleteItem } from "../services/indexedDB";

export function useTaskActions(
  currentTask: Ref<TimelineItemRecord | null>,
  refreshItems: () => Promise<void>
) {
  // Status transition map
  const statusTransitions = {
    todo: "in-progress",
    "in-progress": "done",
    done: "todo",
  } as const;

  // Position for the actions popover
  const actionsPopoverPosition = ref({ top: 0, left: 0 });
  const showActionsPopover = ref(false);

  // Get the next status label
  const nextStatusLabel = computed(() => {
    if (!currentTask.value || !currentTask.value.status)
      return "Mark as In Progress";

    const currentStatus = currentTask.value.status;
    const nextStatus = statusTransitions[currentStatus];

    switch (nextStatus) {
      case "in-progress":
        return "Mark as In Progress";
      case "done":
        return "Mark as Done";
      case "todo":
        return "Reset to To Do";
      default:
        return "Change Status";
    }
  });

  // Get the previous status label
  const previousStatusLabel = computed(() => {
    if (!currentTask.value || !currentTask.value.status) return "";

    const currentStatus = currentTask.value.status;

    switch (currentStatus) {
      case "todo":
        return ""; // No previous status
      case "in-progress":
        return "Reset to To Do";
      case "done":
        return "Mark as In Progress";
      default:
        return "Change Status";
    }
  });

  // Set position for actions popover
  const openActionsPopover = (elementRef: HTMLElement) => {
    if (!elementRef) {
      console.error('No element reference provided for actions popover');
      return;
    }
    
    console.log('Opening actions popover', elementRef);
    
    const rect = elementRef.getBoundingClientRect();
    actionsPopoverPosition.value = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    };
    
    console.log('Popover position', actionsPopoverPosition.value);
    showActionsPopover.value = true;
  };

  // Close actions popover
  const closeActionsPopover = () => {
    showActionsPopover.value = false;
  };

  // Change task status to next state
  const changeTaskStatusForward = async () => {
    if (!currentTask.value || !currentTask.value.id) return;

    const task = { ...currentTask.value };
    const currentStatus = task.status || "todo";
    task.status = statusTransitions[currentStatus];

    try {
      await updateItem(task);
      await refreshItems();
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    closeActionsPopover();
  };

  // Change task status to previous state
  const changeTaskStatusBackward = async () => {
    if (!currentTask.value || !currentTask.value.id) return;

    const task = { ...currentTask.value };
    const currentStatus = task.status || "todo";

    // Determine previous status
    let previousStatus: "todo" | "in-progress" | "done" = "todo";
    if (currentStatus === "in-progress") previousStatus = "todo";
    else if (currentStatus === "done") previousStatus = "in-progress";

    task.status = previousStatus;

    try {
      await updateItem(task);
      await refreshItems();
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    closeActionsPopover();
  };

  // Delete the current task
  const deleteTask = async () => {
    if (!currentTask.value || !currentTask.value.id) return;

    try {
      await deleteItem(currentTask.value.id);
      await refreshItems();
    } catch (error) {
      console.error("Error deleting task:", error);
    }

    closeActionsPopover();
  };

  return {
    showActionsPopover,
    actionsPopoverPosition,
    nextStatusLabel,
    previousStatusLabel,
    openActionsPopover,
    closeActionsPopover,
    changeTaskStatusForward,
    changeTaskStatusBackward,
    deleteTask,
  };
}
