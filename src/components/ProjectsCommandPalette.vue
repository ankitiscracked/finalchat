<template>
  <UCommandPalette
    v-model="projectValue"
    :placeholder="props.placeholder ? props.placeholder : 'Select a project...'"
    :groups="[{ id: 'labels', items: projectOptions }]"
    @update:model-value="onProjectSelect"
  ></UCommandPalette>
</template>

<script setup lang="ts">
import type { CommandPaletteItem } from "@nuxt/ui";

const props = defineProps<{
  placeholder?: string;
  onProjectSelect?: (item: CommandPaletteItem) => void;
}>();

const projectValue = ref({});
const { projects, selectProject } = useProjects("");
const projectOptions = computed(() => {
  return projects.value.map((project) => ({
    label: project.name,
    value: project.id,
  }));
});
</script>
