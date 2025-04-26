export interface FocusState {
  isActive: boolean;
  currentIndex: number;
  currentTaskId: number | null;
}

// Selected task IDs
const selectedTaskIds = ref<Set<number>>(new Set());

// Computed array for selected task IDs
const selectedTasks = computed(() => Array.from(selectedTaskIds.value));

const focusState = ref<FocusState>({
  isActive: false,
  currentIndex: -1,
  currentTaskId: null,
});

export function useTaskSelection() {
  // Clear selection
  const clearSelection = () => {
    selectedTaskIds.value.clear();
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: number | undefined) => {
    if (taskId === undefined) return;

    if (selectedTaskIds.value.has(taskId)) {
      selectedTaskIds.value.delete(taskId);
    } else {
      selectedTaskIds.value.add(taskId);
    }
    // Ensure reactivity by creating a new Set
    selectedTaskIds.value = new Set(selectedTaskIds.value);
    console.log("Selected task IDs:", Array.from(selectedTaskIds.value));
  };
  return {
    selectedTasks,
    toggleTaskSelection,
    clearSelection,
    focusState,
  };
}
