<template>
  <UPopover
    v-model:open="showProjectPopover"
    :content="{
        positionStrategy: 'absolute',
        side: 'top',
        reference: chatInputTextAreaRef!,
      }"
    :portal="false"
    @update:open="
      (val) => {
        if (!val) {
          chatInputTextAreaRef?.focus();
        }
      }
    "
  >
    <template #content>
      <ProjectsCommandPalette />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const { showProjectPopover } = useCommands();

const { chatInputTextAreaRef } = useGlobalElementAffordances();
</script>
