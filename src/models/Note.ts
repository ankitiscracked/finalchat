import type { BaseModel } from "./BaseModel";

/**
 * Note model representing a note item
 */
export interface Note extends BaseModel {
  type: "default" | "note";
  content: string;
  collectionId?: number;
}
