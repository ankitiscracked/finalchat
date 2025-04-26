import { ref, computed, onMounted, nextTick, type Ref } from "vue";
import type { TimelineItemRecord } from "../services/indexedDB";

export function useFocusable(
  items: Ref<TimelineItemRecord[]>,
  chatInputRef: Ref<HTMLTextAreaElement | null>
) {
  const { selectedTasks, toggleTaskSelection, focusState } = useTaskSelection();
  // Focus state

  // Initialize taskRefs with a proper type to allow undefined values
  const taskRefs = ref<(HTMLElement | undefined)[]>([]);

  // Set refs for all task items
  const setTaskRef = (el: HTMLElement | null, index: number) => {
    if (el) {
      console.log(`Setting task ref for index ${index}`);
      taskRefs.value[index] = el;
    } else {
      taskRefs.value[index] = undefined; // Clear the ref if the element is null
    }
  };

  // Filter tasks only
  const tasks = computed(() => {
    return items.value.filter((item) => item.type === "task");
  });

  // Get the currently focused task
  const currentTask = computed(() => {
    if (
      focusState.value.currentIndex >= 0 &&
      focusState.value.currentIndex < tasks.value.length
    ) {
      return tasks.value[focusState.value.currentIndex];
    }
    return null;
  });

  // Activate task navigation mode
  const activateTaskFocus = () => {
    if (tasks.value.length === 0) {
      console.log("No tasks to focus");
      return;
    }

    console.log(
      `Activating task focus. Tasks: ${tasks.value.length}, Refs: ${taskRefs.value.length}`
    );

    focusState.value.isActive = true;
    focusState.value.currentIndex = 0;
    focusState.value.currentTaskId = tasks.value[0].id || null;

    // Focus the first task element after the DOM updates
    nextTick(() => {
      console.log(`Focusing task. Refs available: ${taskRefs.value.length}`);
      if (taskRefs.value.length > 0 && taskRefs.value[0]) {
        console.log("Focusing first task element");
        taskRefs.value[0].focus();
      } else {
        console.warn("No task refs available to focus");
      }
    });
  };

  // Move focus to next/previous task
  const navigateTasks = (direction: 1 | -1) => {
    if (!focusState.value.isActive || tasks.value.length === 0) return;

    const newIndex = focusState.value.currentIndex + direction;

    // Check bounds
    if (newIndex >= 0 && newIndex < tasks.value.length) {
      focusState.value.currentIndex = newIndex;
      focusState.value.currentTaskId = tasks.value[newIndex].id || null;

      // Focus the DOM element
      nextTick(() => {
        const taskElement = taskRefs.value[newIndex];
        if (taskElement) {
          taskElement.focus();
        } else {
          console.warn(`Task element not found for index ${newIndex}`);
        }
      });
    }
  };

  // Deactivate task navigation and return to chat input
  const deactivateTaskFocus = () => {
    focusState.value.isActive = false;
    focusState.value.currentIndex = -1;
    focusState.value.currentTaskId = null;

    // Return focus to chat input
    nextTick(() => {
      if (chatInputRef.value) {
        chatInputRef.value.focus();
      }
    });
  };

  // Handle keyboard events for task navigation and selection
  const handleTaskKeydown = (event: KeyboardEvent) => {
    if (!focusState.value.isActive) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        navigateTasks(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        navigateTasks(-1);
        break;
      case "Escape":
        event.preventDefault();
        deactivateTaskFocus();
        break;
      case "Enter":
        event.preventDefault();
        if (focusState.value.currentTaskId !== null) {
          toggleTaskSelection(focusState.value.currentTaskId);
        }
        break;
      case "a":
        // Trigger the actions popover
        event.preventDefault();
        return true; // Signal that 'a' was pressed on a task
        break;
    }
    return false;
  };

  return {
    focusState,
    tasks,
    taskRefs,
    setTaskRef,
    currentTask,
    activateTaskFocus,
    navigateTasks,
    deactivateTaskFocus,
    handleTaskKeydown,
    selectedTasks,
  };
}
