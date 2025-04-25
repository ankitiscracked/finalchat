<template>
  <div class="task-actions-popover" :style="positionStyle">
    <div class="popover-header">
      <h3>Task Actions</h3>
    </div>
    <div class="popover-content">
      <div
        v-if="nextStatusLabel"
        class="action-item"
        @click="$emit('forwardStatus')"
        ref="forwardActionRef"
        tabindex="0"
        @keydown.enter="$emit('forwardStatus')"
        @keydown.up="navigateActions(-1)"
        @keydown.down="navigateActions(1)"
        @keydown.esc="$emit('close')"
      >
        <span class="action-icon">
          <i class="ph-bold ph-arrow-circle-right"></i>
        </span>
        <span class="action-name">{{ nextStatusLabel }}</span>
      </div>

      <div
        v-if="previousStatusLabel"
        class="action-item"
        @click="$emit('backwardStatus')"
        ref="backwardActionRef"
        tabindex="0"
        @keydown.enter="$emit('backwardStatus')"
        @keydown.up="navigateActions(-1)"
        @keydown.down="navigateActions(1)"
        @keydown.esc="$emit('close')"
      >
        <span class="action-icon">
          <i class="ph-bold ph-arrow-circle-left"></i>
        </span>
        <span class="action-name">{{ previousStatusLabel }}</span>
      </div>

      <div
        class="action-item delete-action"
        @click="$emit('delete')"
        ref="deleteActionRef"
        tabindex="0"
        @keydown.enter="$emit('delete')"
        @keydown.up="navigateActions(-1)"
        @keydown.down="navigateActions(1)"
        @keydown.esc="$emit('close')"
      >
        <span class="action-icon">
          <i class="ph-bold ph-trash"></i>
        </span>
        <span class="action-name">Delete Task</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  position: { top: number; left: number };
  nextStatusLabel: string;
  previousStatusLabel?: string;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "forwardStatus"): void;
  (e: "backwardStatus"): void;
  (e: "delete"): void;
}>();

// Action refs for focus management
const forwardActionRef = ref<HTMLElement | null>(null);
const backwardActionRef = ref<HTMLElement | null>(null);
const deleteActionRef = ref<HTMLElement | null>(null);

// Current focused action index
const currentActionIndex = ref(0);

// Computed style for positioning the popover
const positionStyle = computed(() => {
  return {
    top: `${props.position.top}px`,
    left: `${props.position.left}px`,
  };
});

// Get all available action refs
const getActionRefs = (): (HTMLElement | null)[] => {
  const refs = [];
  if (forwardActionRef.value) refs.push(forwardActionRef.value);
  if (backwardActionRef.value) refs.push(backwardActionRef.value);
  if (deleteActionRef.value) refs.push(deleteActionRef.value);
  return refs;
};

// Navigate between actions
const navigateActions = (direction: number) => {
  const refs = getActionRefs();
  if (refs.length === 0) return;

  currentActionIndex.value =
    (currentActionIndex.value + direction + refs.length) % refs.length;

  nextTick(() => {
    const currentRef = refs[currentActionIndex.value];
    if (currentRef) {
      currentRef.focus();
    }
  });
};

// Focus the first action when component is mounted
onMounted(() => {
  nextTick(() => {
    const refs = getActionRefs();
    if (refs.length > 0 && refs[0]) {
      refs[0].focus();
    }
  });
});
</script>

<style lang="scss" scoped>
@import "../../styles/main.scss";

// Colors
$popover-bg: $white;
$border-color: $gray-300;
$text-color: $gray-800;
$accent-color: $orange-500;
$accent-hover: $orange-600;
$danger-color: $gray-700;
$danger-hover: #e53e3e;
$item-hover-bg: $gray-100;

.task-actions-popover {
  position: absolute;
  width: 220px;
  background-color: $popover-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;

  .popover-header {
    padding: 12px 15px;
    border-bottom: 1px solid $border-color;
    background-color: $gray-100;

    h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: $text-color;
    }
  }

  .popover-content {
    .action-item {
      display: flex;
      align-items: center;
      padding: 10px 15px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover,
      &:focus {
        background-color: $item-hover-bg;
        outline: none;
      }

      &:focus {
        box-shadow: inset 0 0 0 2px rgba($accent-color, 0.4);
      }

      .action-icon {
        margin-right: 12px;
        font-size: 1.1rem;
        color: $accent-color;
        display: flex;
        align-items: center;
      }

      .action-name {
        font-size: 0.9rem;
        color: $text-color;
      }

      &.delete-action {
        border-top: 1px solid $border-color;

        .action-icon {
          color: $danger-color;
        }

        &:hover,
        &:focus {
          .action-icon,
          .action-name {
            color: $danger-hover;
          }
        }
      }
    }
  }
}
</style>
