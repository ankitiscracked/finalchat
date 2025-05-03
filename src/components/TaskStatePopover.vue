<template>
  <UPopover v-model:open="open">
    <template #content>
      <div>hello world</div>
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const props = defineProps<{
  isTaskPopoverOpen: boolean;
}>();

const open = ref(false);

watch(
  () => props.isTaskPopoverOpen,
  (newVal) => {
    if (newVal) {
      // Logic to handle when the popover opens
      console.log("Popover opened");
    } else {
      // Logic to handle when the popover closes
      console.log("Popover closed");
    }
    open.value = newVal;
  }
);
</script>
