import { ref } from 'vue';

// Create reactive state
const selectedTaskIds = ref<number[]>([]);
const focusState = ref({
  isActive: false,
  currentIndex: -1,
  currentTaskId: null as number | null,
});

/**
 * Composable for managing task selection and focus state
 */
export function useTaskSelection() {
  
  /**
   * Toggle selection for a task
   */
  const toggleTaskSelection = (taskId: number) => {
    const index = selectedTaskIds.value.indexOf(taskId);
    if (index === -1) {
      // Add to selection
      selectedTaskIds.value = [...selectedTaskIds.value, taskId];
    } else {
      // Remove from selection
      selectedTaskIds.value = selectedTaskIds.value.filter(id => id !== taskId);
    }
  };
  
  /**
   * Clear all selected tasks
   */
  const clearSelection = () => {
    selectedTaskIds.value = [];
  };
  
  /**
   * Select a list of tasks
   */
  const selectTasks = (taskIds: number[]) => {
    selectedTaskIds.value = taskIds;
  };
  
  /**
   * Check if a task is selected
   */
  const isTaskSelected = (taskId: number) => {
    return selectedTaskIds.value.includes(taskId);
  };

  return {
    selectedTaskIds,
    focusState,
    toggleTaskSelection,
    clearSelection,
    selectTasks,
    isTaskSelected
  };
}