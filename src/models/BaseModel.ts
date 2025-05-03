/**
 * Base model with common properties for all entities
 */
export interface BaseModel {
  id?: number;
  type: ItemType;
  createdAt: Date;
}
