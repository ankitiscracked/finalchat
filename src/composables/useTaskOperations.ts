import { ref, computed } from 'vue';
import { deleteItems, updateItem, type TimelineItemRecord } from '../services/indexedDB';
import { loadTimelineItems } from '../services/timelineService';
import { useTaskSelection } from './useTaskSelection';

// Create a state object to hold our timeline data
const timeline = ref<TimelineItemRecord[]>([]);
const isLoading = ref(false);

// Cache of task indices for quick lookup
const taskIndexMap = ref(new Map<number, number>());

export function useTaskOperations() {
  const { selectedTasks, clearSelection, focusState } = useTaskSelection();

  // Function to load timeline data
  const loadTimelineData = async () => {
    try {
      isLoading.value = true;
      timeline.value = await loadTimelineItems();
      console.log(`Loaded ${timeline.value.length} items from IndexedDB.`);
      // Clear the task index map whenever timeline data changes
      taskIndexMap.value.clear();
    } catch (error) {
      console.error("Error loading timeline items:", error);
      timeline.value = [];
    } finally {
      isLoading.value = false;
    }
    return timeline.value;
  };

  // Helper function to get task index in the tasks array
  const getTaskIndex = (task: TimelineItemRecord): number => {
    if (!task.id) {
      throw new Error("Task is missing an id. All tasks must have a valid id.");
    }

    // Filter to get only tasks
    const tasks = timeline.value.filter(item => item.type === "task");

    // Update taskIndexMap whenever tasks change
    if (taskIndexMap.value.size !== tasks.length) {
      taskIndexMap.value.clear();
      tasks.forEach((task, index) => {
        if (task.id) taskIndexMap.value.set(task.id, index);
      });
    }

    return taskIndexMap.value.get(task.id) ?? -1;
  };

  // Function to get tasks to delete
  const getTasksToDelete = () => {
    if (selectedTasks.value && selectedTasks.value.length > 0) {
      return selectedTasks.value;
    }
    return focusState.value.currentTaskId !== null
      ? [focusState.value.currentTaskId]
      : [];
  };

  // Function to delete selected tasks
  const deleteSelectedTasks = async () => {
    const tasksToDelete = getTasksToDelete();
    if (tasksToDelete.length === 0) return;
    
    await deleteItems(tasksToDelete);
    clearSelection();
    await loadTimelineData();
  };

  // Handle edit task
  const editTask = async ({ taskId, newContent }) => {
    try {
      // Find the task in timeline
      const idx = timeline.value.findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        // Update in memory
        const updatedTask = { ...timeline.value[idx], content: newContent };
        timeline.value[idx] = updatedTask;
        
        // Persist to database
        if (updatedTask.id) {
          await updateItem(updatedTask);
          console.log(`Task ${taskId} updated successfully`);
        }
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  // Handle move tasks
  const moveTasks = async ({ selectedTasks, currentTaskId, newState }) => {
    try {
      const tasksToUpdate = selectedTasks.length > 0 ? selectedTasks : [currentTaskId];
      
      for (const id of tasksToUpdate) {
        // Find the task in timeline
        const idx = timeline.value.findIndex((t) => t.id === id);
        if (idx !== -1) {
          // Update in memory
          const updatedTask = { ...timeline.value[idx], status: newState };
          timeline.value[idx] = updatedTask;
          
          // Persist to database
          if (updatedTask.id) {
            await updateItem(updatedTask);
            console.log(`Task ${id} status updated to ${newState}`);
          }
        }
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Get only tasks (filtered from timeline)
  const tasks = computed(() => {
    return timeline.value.filter(item => item.type === "task");
  });

  return {
    timeline,
    tasks,
    isLoading,
    loadTimelineData,
    deleteSelectedTasks,
    editTask,
    moveTasks,
    getTaskIndex,
    taskIndexMap
  };
}