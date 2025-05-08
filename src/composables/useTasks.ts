import _ from "lodash";
import { computed, onMounted } from "vue";
import type { TaskRecord } from "../services/indexedDB";

const TASKS_STORE = "tasks";

/**
 *
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

    await loadTasks();
    isInitialized.value = true;
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
      const task: Omit<TaskRecord, "id"> = {
        type: "task",
        content,
        status: "todo",
        createdAt: new Date(),
        projectId,
      };

      const id = await addItem<TaskRecord>(TASKS_STORE, task);
      tasks.value = [{ ...task, id }, ...tasks.value];
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
      const task = await getItemById<TaskRecord>(TASKS_STORE, id);
      if (!task) {
        throw new Error(`Task with id ${id} not found`);
      }
      const updatedTask: TaskRecord = { ...task, ...updates };
      await updateItem<TaskRecord>(TASKS_STORE, updatedTask);
      await loadTasks(); // Refresh tasks after update
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete a task
   */
  const deleteTask = async (id: number) => {
    isLoading.value = true;
    try {
      await deleteItem(TASKS_STORE, id);
      loadTasks(); // Refresh tasks after deletion
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
      await deleteItems(TASKS_STORE, ids);
      loadTasks(); // Refresh tasks after deletion
    } catch (error) {
      console.error("Failed to delete tasks:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const unscheduledTasks = computed(() => {
    return tasks.value.filter((task) => task.scheduledAt === null);
  });

  async function loadTasks() {
    isLoading.value = true;
    try {
      const result = await getAllItems<TaskRecord>(TASKS_STORE);
      tasks.value = _.orderBy(result, ["createdAt"], ["desc"]);
    } catch (error) {
      console.error("Failed to initialize tasks:", error);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    tasks,
    isLoading,
    isInitialized,
    getByStatus,
    getByProject,
    createTask,
    updateTask,
    deleteTask,
    deleteMultiple,
    initialize,
    unscheduledTasks,
  };
}
