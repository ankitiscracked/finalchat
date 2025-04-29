<template>
  <PopoverRoot :open="isOpen" @update:open="$emit('update:isOpen', $event)">
    <PopoverTrigger :as-child="true">
      <slot name="trigger" />
    </PopoverTrigger>
    
    <PopoverPortal>
      <PopoverContent 
        class="task-popover-content"
        :side="side"
        :side-offset="sideOffset"
        :align="align"
      >
        <div class="popover-header">
          <h3>{{ isEditing ? 'Edit Task' : 'Task Details' }}</h3>
          <PopoverClose class="close-button">
            <i class="ph-bold ph-x"></i>
          </PopoverClose>
        </div>
        
        <div class="popover-body">
          <!-- View Mode -->
          <div v-if="!isEditing" class="view-mode">
            <div class="task-content">
              {{ task.content }}
            </div>
            
            <div class="task-meta">
              <div class="task-status" :class="[`status-${task.status || 'todo'}`]">
                {{ formatStatus(task.status || "todo") }}
              </div>
              
              <div v-if="task.projectId" class="task-project">
                in <span class="project-tag">#{{ getProjectName(task.projectId) }}</span>
              </div>
              
              <div class="task-date">
                Created: {{ formatDateTime(task.createdAt) }}
              </div>
            </div>
            
            <div class="action-buttons">
              <button 
                class="edit-button"
                @click="isEditing = true"
              >
                <i class="ph-bold ph-pencil"></i> Edit
              </button>
            </div>
          </div>
          
          <!-- Edit Mode -->
          <div v-else class="edit-mode">
            <form @submit.prevent="saveTask">
              <div class="form-group">
                <label for="taskContent">Task Description</label>
                <textarea
                  id="taskContent"
                  v-model="editedTask.content"
                  rows="3"
                  class="task-input"
                  ref="taskInputRef"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="taskStatus">Status</label>
                <select id="taskStatus" v-model="editedTask.status" class="status-input">
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              
              <div class="form-actions">
                <button 
                  type="button" 
                  class="cancel-button" 
                  @click="cancelEdit"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="save-button"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <PopoverArrow />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import type { TimelineItemRecord } from '../../services/indexedDB';
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
  PopoverClose,
  PopoverArrow
} from 'reka-ui';

// Props
const props = defineProps<{
  isOpen: boolean;
  task: TimelineItemRecord;
  projects: any[];
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}>();

// Default values for props
const side = props.side || 'bottom';
const align = props.align || 'start';
const sideOffset = props.sideOffset || 5;

// Events
const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'save', task: TimelineItemRecord): void;
}>();

// State
const isEditing = ref(false);
const taskInputRef = ref<HTMLTextAreaElement | null>(null);

// Create a copy of the task for editing
const editedTask = ref<TimelineItemRecord>({
  ...props.task
});

// Reset editedTask when the original task changes
watch(() => props.task, (newTask) => {
  editedTask.value = { ...newTask };
});

// Reset editing state when popover closes
watch(() => props.isOpen, (isOpen) => {
  if (!isOpen) {
    isEditing.value = false;
  }
});

// Format date and time
function formatDateTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format status
function formatStatus(status: string): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "in-progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status;
  }
}

// Get project name by ID
function getProjectName(projectId: number): string {
  const project = props.projects.find((p) => p.id === projectId);
  return project ? project.name : "Unknown Project";
}

// Save the edited task
function saveTask() {
  // Ensure content is not empty
  if (!editedTask.value.content.trim()) {
    return;
  }
  
  emit('save', editedTask.value);
  isEditing.value = false;
}

// Cancel editing and revert changes
function cancelEdit() {
  editedTask.value = { ...props.task };
  isEditing.value = false;
}

// Focus textarea when switching to edit mode
watch(isEditing, (editing) => {
  if (editing) {
    nextTick(() => {
      if (taskInputRef.value) {
        taskInputRef.value.focus();
        taskInputRef.value.select();
      }
    });
  }
});
</script>

<style lang="scss" scoped>
@import "../../styles/main.scss";

// Colors
$popover-bg: $white;
$border-color: $gray-300;
$text-color: $gray-800;
$accent-color: $orange-500;
$input-bg: $gray-100;
$input-focus: $white;

.task-popover-content {
  width: 350px;
  background-color: $popover-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  
  .popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    border-bottom: 1px solid $border-color;
    background-color: $gray-100;

    h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: $text-color;
    }
    
    .close-button {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      color: $gray-600;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        color: $gray-800;
      }
    }
  }
  
  .popover-body {
    padding: 15px;
    
    .view-mode {
      .task-content {
        font-size: 1rem;
        line-height: 1.5;
        margin-bottom: 15px;
        word-break: break-word;
      }
      
      .task-meta {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 0.85rem;
        color: $gray-600;
        margin-bottom: 15px;
        
        .task-status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 500;
          
          &.status-todo {
            background-color: rgba($gray-300, 0.6);
            color: $gray-700;
          }
          
          &.status-in-progress {
            background-color: rgba($orange-200, 0.6);
            color: $orange-700;
          }
          
          &.status-done {
            background-color: rgba($gray-100, 0.6);
            color: $gray-600;
            text-decoration: line-through;
          }
        }
        
        .task-project {
          .project-tag {
            background-color: rgba($orange-200, 0.7);
            padding: 2px 6px;
            border-radius: 4px;
            color: $orange-700;
            font-weight: 500;
          }
        }
        
        .task-date {
          color: $gray-500;
        }
      }
      
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        
        .edit-button {
          background-color: $gray-200;
          color: $gray-700;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          
          &:hover {
            background-color: $gray-300;
          }
        }
      }
    }
    
    .edit-mode {
      .form-group {
        margin-bottom: 15px;
        
        label {
          display: block;
          margin-bottom: 5px;
          font-size: 0.85rem;
          font-weight: 500;
          color: $gray-700;
        }
        
        .task-input, .status-input {
          width: 100%;
          padding: 10px;
          font-size: 0.95rem;
          border: 1px solid $border-color;
          border-radius: 4px;
          background-color: $input-bg;
          font-family: inherit;
          
          &:focus {
            outline: none;
            border-color: $accent-color;
            background-color: $input-focus;
          }
        }
        
        .task-input {
          resize: vertical;
          min-height: 80px;
        }
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
          
          &.cancel-button {
            background-color: $gray-200;
            color: $gray-700;
            
            &:hover {
              background-color: $gray-300;
            }
          }
          
          &.save-button {
            background-color: $accent-color;
            color: white;
            
            &:hover {
              background-color: darken($accent-color, 5%);
            }
          }
        }
      }
    }
  }
}
</style>