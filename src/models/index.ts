export * from "./BaseModel";
export * from "./Task";
export * from "./Event";
export * from "./Note";
export * from "./Project";
export * from "./Collection";

// Backward compatibility with existing TimelineItemRecord
import type { Task } from "./Task";
import type { Event } from "./Event";
import type { Note } from "./Note";

export type TimelineItem = Task | Event | Note;
