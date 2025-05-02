export const allItemTypes = ["task", "event", "note"] as const;
export type ItemType = (typeof allItemTypes)[number];
export type OverviewType = "standard" | "ai";
