import { ref } from 'vue';
import { deleteItems, updateItem, type TimelineItemRecord } from '../services/indexedDB';
import { loadTimelineItems } from '../services/timelineService';
import { useTaskSelection } from './useTaskSelection';

// Create a state object to hold our timeline data
const timeline = ref<TimelineItemRecord[]>([]);
const isLoading = ref(false);

export function useTaskOperations() {
  const { selectedTasks, clearSelection, focusState } = useTaskSelection();

  // Function to load timeline data
  const loadTimelineData = async () => {
    try {
      isLoading.value = true;
      timeline.value = await loadTimelineItems();
      console.log(`Loaded ${timeline.value.length} items from IndexedDB.`);
    } catch (error) {
      console.error("Error loading timeline items:", error);
      timeline.value = [];
    } finally {
      isLoading.value = false;
    }
    return timeline.value;
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

  return {
    timeline,
    isLoading,
    loadTimelineData,
    deleteSelectedTasks,
    editTask,
    moveTasks
  };
}