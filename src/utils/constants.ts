export const allItemTypes = ["task", "event", "note"] as const;
export type ItemType = (typeof allItemTypes)[number];
export type OverviewMode = "standard" | "ai";
export type OverviewType =
  | "item-list"
  | "week-tasks"
  | "unscheduled-tasks"
  | "calendar"
  | "project-tasks";
