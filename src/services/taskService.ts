import {
  addItem,
  deleteItem,
  deleteItems,
  getAllItems,
  getItemById,
  getItemsByIndex,
  updateItem,
  type TaskRecord
} from "./indexedDB";

// Store names
const TASKS_STORE = "tasks";

/**
 * Get all tasks from the database
 */
export async function getAllTasks(): Promise<TaskRecord[]> {
  const tasks = await getAllItems<TaskRecord>(TASKS_STORE);
  // Sort by creation time, newest first
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return tasks;
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: number): Promise<TaskRecord | null> {
  return await getItemById<TaskRecord>(TASKS_STORE, id);
}

/**
 * Create a new task
 */
export async function createTask(
  content: string,
  status: "todo" | "in-progress" | "done" = "todo",
  projectId?: number
): Promise<TaskRecord> {
  const task: Omit<TaskRecord, "id"> = {
    type: "task",
    content,
    status,
    createdAt: new Date(),
    projectId
  };
  
  const id = await addItem<TaskRecord>(TASKS_STORE, task);
  return { ...task, id };
}

/**
 * Update a task
 */
export async function updateTask(
  id: number,
  updates: Partial<Omit<TaskRecord, "id" | "type">>
): Promise<TaskRecord> {
  const task = await getTaskById(id);
  if (!task) {
    throw new Error(`Task with id ${id} not found`);
  }
  
  const updatedTask: TaskRecord = { ...task, ...updates };
  await updateItem<TaskRecord>(TASKS_STORE, updatedTask);
  return updatedTask;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  id: number,
  status: "todo" | "in-progress" | "done"
): Promise<TaskRecord> {
  return await updateTask(id, { status });
}

/**
 * Delete a task
 */
export async function deleteTask(id: number): Promise<void> {
  await deleteItem(TASKS_STORE, id);
}

/**
 * Delete multiple tasks
 */
export async function deleteMultipleTasks(ids: number[]): Promise<void> {
  await deleteItems(TASKS_STORE, ids);
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(status: "todo" | "in-progress" | "done"): Promise<TaskRecord[]> {
  const tasks = await getItemsByIndex<TaskRecord>(TASKS_STORE, "status", status);
  // Sort by creation time, newest first
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return tasks;
}

/**
 * Get tasks by project
 */
export async function getTasksByProject(projectId: number): Promise<TaskRecord[]> {
  const tasks = await getItemsByIndex<TaskRecord>(TASKS_STORE, "projectId", projectId);
  // Sort by creation time, newest first
  tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return tasks;
}