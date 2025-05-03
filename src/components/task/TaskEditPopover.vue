<template>
  <div class="task-edit-popover reka-popover" :style="positionStyle">
    <div class="popover-header">
      <h3>Edit Task</h3>
      <button @click="$emit('close')" class="close-button">
        <i class="ph-bold ph-x"></i>
      </button>
    </div>
    <div class="popover-content">
      <form @submit.prevent="saveTask">
        <div class="form-group">
          <label for="taskContent">Task Description</label>
          <textarea
            id="taskContent"
            v-model="editedTask.content"
            rows="3"
            class="task-input reka-input"
            @keydown.esc.stop="$emit('close')"
            ref="taskInputRef"
          ></textarea>
        </div>

        <div class="form-group">
          <label for="taskStatus">Status</label>
          <select
            id="taskStatus"
            v-model="editedTask.status"
            class="status-input reka-select"
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="cancel-button reka-button"
            @click="$emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="save-button reka-button reka-button-primary"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import type { TimelineItemRecord } from "../../services/indexedDB";

const props = defineProps<{
  position: { top: number; left: number };
  task: TimelineItemRecord;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "save", task: TimelineItemRecord): void;
}>();

// Create a copy of the task for editing
const editedTask = ref<TimelineItemRecord>({
  ...props.task,
});

// Reference to the input field for focus
const taskInputRef = ref<HTMLTextAreaElement | null>(null);

// Computed style for positioning the popover
const positionStyle = computed(() => {
  return {
    top: `${props.position.top}px`,
    left: `${props.position.left}px`,
  };
});

// Save the edited task
const saveTask = () => {
  // Ensure content is not empty
  if (!editedTask.value.content.trim()) {
    return;
  }

  emit("save", editedTask.value);
};

// Focus the input field when component is mounted
onMounted(() => {
  if (taskInputRef.value) {
    taskInputRef.value.focus();
    // Select all text for easy editing
    taskInputRef.value.select();
  }
});
</script>

<style lang="scss" scoped>
// Colors
$popover-bg: $white;
$border-color: $gray-300;
$text-color: $gray-800;
$accent-color: $orange-500;
$input-bg: $gray-100;
$input-focus: $white;

.task-edit-popover {
  position: absolute;
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

  .popover-content {
    padding: 15px;

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        font-size: 0.85rem;
        font-weight: 500;
        color: $gray-700;
      }

      .task-input,
      .status-input {
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
</style>
