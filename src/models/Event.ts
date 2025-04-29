import type { BaseModel } from "./BaseModel";

/**
 * Event model representing an event item
 */
export interface Event extends BaseModel {
  type: "event";
  content: string;
  projectId?: number;
  collectionId?: number;
}
