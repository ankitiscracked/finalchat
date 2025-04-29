import type { BaseModel } from "./BaseModel";

export type TaskStatus = "todo" | "in-progress" | "done";

/**
 * Task model representing a task item
 */
export interface Task extends BaseModel {
  type: "task";
  content: string;
  status: TaskStatus;
  projectId?: number;
}
