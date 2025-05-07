<template>
  <UDrawer v-model:open="showCommandsDrawer" direction="bottom" :handle="false">
    <template #content>
      <div class="p-4">
        <h3 class="text-md font-semibold">Available Commands</h3>
        <div class="columns-3 mt-2">
          <div v-for="(commandGroup, index) in commandColumns" :key="index">
            <div class="flex flex-col gap-4 max-h-max">
              <div
                v-for="command in commandGroup"
                :key="command.name"
                class="flex flex-col gap-1"
              >
                <span
                  class="text-xs px-1 py-0.5 border border-gray-300 bg-gray-100 rounded-sm max-w-max"
                  >{{ command.name }}</span
                >
                <div class="text-xs">
                  {{ command.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

const { showCommandsDrawer } = useGlobalElementAffordances();

const commands = [
  { name: "/task", description: "Create a new task" },
  { name: "/spend", description: "Log an expense" },
  { name: "/event", description: "Add a calendar event" },
  { name: "/note", description: "Write a note" },
  { name: "/show", description: "Show overview of items" },
  { name: "/close-overview", description: "Close the overview panel" },
  { name: "/ai-overview", description: "Show AI-generated overview" },
  { name: "/canvas", description: "Open the canvas view" },
  { name: "/close-canvas", description: "Close the canvas view" },
  { name: "/delete", description: "Delete selected item" },
  { name: "/move-to", description: "Move item to a collection" },
  { name: "/edit", description: "Edit selected item" },
];

// Organize commands into columns (max 5 per column)
const commandColumns = computed(() => {
  const columnsArray = [];
  const itemsPerColumn = 5;

  for (let i = 0; i < commands.length; i += itemsPerColumn) {
    columnsArray.push(commands.slice(i, i + itemsPerColumn));
  }

  return columnsArray;
});
</script>

<style lang="scss">
.commands-drawer {
  .drawer-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .drawer-content {
    background-color: #f3f4f6;
    height: fit-content;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    outline: none;
  }

  .drawer-inner {
    padding: 1rem;
    background-color: white;
  }

  .drawer-title {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .drawer-description {
    font-size: 0.875rem;
    color: #6b7280;
    margin-bottom: 1rem;
  }

  .commands-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .commands-column {
    flex: 1;
    min-width: 200px;
  }

  .command-item {
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 0.375rem;
    background-color: #f3f4f6;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e5e7eb;
    }
  }

  .command-name {
    font-weight: 600;
    font-family: monospace;
    margin-bottom: 0.25rem;
  }

  .command-description {
    font-size: 0.875rem;
    color: #4b5563;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}
</style>
