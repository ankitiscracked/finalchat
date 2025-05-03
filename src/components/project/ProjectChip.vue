<template>
  <span class="project-chip">
    in <span class="project-name">#{{ project.name }}</span>
    <button
      v-if="removable"
      @click.stop="$emit('remove')"
      class="remove-btn"
      aria-label="Remove project"
    >
      <i class="ph-bold ph-x"></i>
    </button>
  </span>
</template>

<script setup lang="ts">
// With Nuxt auto-imports, we don't need explicit imports
import type { ProjectRecord } from "../../services/indexedDB";

defineProps<{
  project: ProjectRecord;
  removable?: boolean;
}>();

defineEmits<{
  (e: "remove"): void;
}>();
</script>

<style lang="scss" scoped>
.project-chip {
  display: inline-flex;
  align-items: center;
  background-color: rgba($orange-100, 0.9);
  border: 1px solid $orange-200;
  border-radius: 4px;
  padding: 2px 6px;
  margin-left: 4px;
  font-size: 0.9em;
  color: $gray-700;

  .project-name {
    color: $orange-700;
    font-weight: 500;
    margin: 0 2px;
  }

  .remove-btn {
    background: none;
    border: none;
    font-size: 0.8em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    margin-left: 2px;
    color: $gray-600;
    cursor: pointer;
    border-radius: 50%;

    &:hover {
      background-color: rgba($orange-200, 0.8);
      color: $gray-800;
    }
  }
}
</style>
