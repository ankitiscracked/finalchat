<template>
  <UModal v-model:open="isDeleteModalOpen">
    <template #content>
      <div class="p-4 rounded-sm">
        <span>Should we delete this task?</span>
        <div class="flex justify-end gap-4">
          <button
            class="px-2 py-1 outline-gray-400 outline-offset-2 rounded-sm"
            @click.prevent="isDeleteModalOpen = false"
          >
            Close
          </button>
          <button
            @click="
              () => {
                deleteTask(props.task.id!);
                isDeleteModalOpen = false;
              }
            "
            class="bg-gray-800 px-2 py-1 text-white rounded-sm outline-offset-2 outline-gray-400"
          >
            Delete
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  task: TaskRecord;
}>();
const isDeleteModalOpen = defineModel<boolean>("isDeleteModalOpen", {
  default: false,
});
</script>
