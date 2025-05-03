import { computed, onMounted } from "vue";
import type { TaskRecord } from "../services/indexedDB";
import * as taskService from "../services/taskService";

/**
 * Composable for working with tasks
 */
export function useTasks() {
  // Reactive state
  const tasks = useState<TaskRecord[]>(() => []);
  const isLoading = useState(() => false);
  const isInitialized = useState(() => false);

  /**
   * Initialize tasks data
   */
  const initialize = async () => {
    if (isInitialized.value) return;

    isLoading.value = true;
    try {
      tasks.value = await taskService.getAllTasks();
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to initialize tasks:", error);
    } finally {
      isLoading.value = false;
    }
  };

  // Initialize on component mount
  onMounted(initialize);

  /**
   * Get tasks filtered by status
   */
  const getByStatus = (status: TaskRecord["status"]) => {
    return computed(() => tasks.value.filter((task) => task.status === status));
  };

  /**
   * Get tasks for a specific project
   */
  const getByProject = (projectId: number) => {
    return computed(() =>
      tasks.value.filter((task) => task.projectId === projectId)
    );
  };

  /**
   * Create a new task
   */
  const createTask = async (content: string, projectId?: number) => {
    isLoading.value = true;
    try {
      const newTask = await taskService.createTask(content, "todo", projectId);
      tasks.value = [newTask, ...tasks.value];
      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update a task
   */
  const updateTask = async (
    id: number,
    updates: Partial<Omit<TaskRecord, "id" | "type">>
  ) => {
    isLoading.value = true;
    try {
      const updatedTask = await taskService.updateTask(id, updates);
      const index = tasks.value.findIndex((task) => task.id === id);
      if (index !== -1) {
        const updatedTasks = [...tasks.value];
        updatedTasks[index] = updatedTask;
        tasks.value = updatedTasks;
      }
      return updatedTask;
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update task status
   */
  const updateTaskStatus = async (id: number, status: TaskRecord["status"]) => {
    await updateTask(id, { status });
    await refreshTasks();
  };

  /**
   * Delete a task
   */
  const deleteTask = async (id: number) => {
    isLoading.value = true;
    try {
      await taskService.deleteTask(id);
      tasks.value = tasks.value.filter((task) => task.id !== id);
    } catch (error) {
      console.error(`Failed to delete task ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete multiple tasks
   */
  const deleteMultiple = async (ids: number[]) => {
    isLoading.value = true;
    try {
      await taskService.deleteMultipleTasks(ids);
      tasks.value = tasks.value.filter(
        (task) => !ids.includes(task.id as number)
      );
    } catch (error) {
      console.error("Failed to delete tasks:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Refresh tasks data from the database
   */
  const refreshTasks = async () => {
    isLoading.value = true;
    try {
      tasks.value = await taskService.getAllTasks();
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    tasks,
    isLoading,
    isInitialized,
    getByStatus,
    getByProject,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    deleteMultiple,
    refreshTasks,
    initialize,
  };
}
