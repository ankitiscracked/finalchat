export const allItemTypes = ["task", "event", "note"] as const;
export type ItemType = (typeof allItemTypes)[number];
export type OverviewMode = "standard" | "ai";
export type OverviewType =
  | "item-list"
  | "week-tasks"
  | "unscheduled-tasks"
  | "upcoming-tasks"
  | "calendar"
  | "project-tasks";

// Command constraints mapping for contextual suggestions
export const commandConstraints: Record<
  string,
  { allowedOverviewTypes: string[] }
> = {
  "move-to": { allowedOverviewTypes: ["task"] },
  // Add more constrained commands here as needed
};
