<template>
  <ClientOnly>
    <DrawerRoot
      :open="isOpen"
      @openChange="(open: boolean) => (isOpen = open)"
      direction="bottom"
      class="commands-drawer"
    >
      <DrawerTrigger class="sr-only"> Open Commands </DrawerTrigger>
      <DrawerPortal>
        <DrawerOverlay class="drawer-overlay" />
        <DrawerContent class="drawer-content">
          <div class="drawer-inner">
            <DrawerTitle class="drawer-title">Available Commands</DrawerTitle>
            <DrawerDescription class="drawer-description">Press Escape to close</DrawerDescription>
            <div class="commands-grid">
              <div
                class="commands-column"
                v-for="(commandGroup, index) in commandColumns"
                :key="index"
              >
                <div
                  v-for="command in commandGroup"
                  :key="command.name"
                  class="command-item"
                >
                  <div class="command-name">{{ command.name }}</div>
                  <div class="command-description">{{ command.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </DrawerRoot>
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useMagicKeys, useKeyModifier, whenever } from "@vueuse/core";

// Only import vaul-vue components on client-side
let DrawerRoot: any, 
    DrawerContent: any, 
    DrawerDescription: any, 
    DrawerTitle: any, 
    DrawerTrigger: any, 
    DrawerPortal: any, 
    DrawerOverlay: any;

onMounted(() => {
  // Dynamic import to ensure this only runs on client
  import("vaul-vue").then((module) => {
    DrawerRoot = module.DrawerRoot;
    DrawerContent = module.DrawerContent;
    DrawerDescription = module.DrawerDescription;
    DrawerTitle = module.DrawerTitle;
    DrawerTrigger = module.DrawerTrigger;
    DrawerPortal = module.DrawerPortal;
    DrawerOverlay = module.DrawerOverlay;
  });
});

const isOpen = ref(false);

// Define all commands with their descriptions
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

// Double space key press detection moved to app.vue for global access

// Method to open the drawer programmatically
const openDrawer = () => {
  isOpen.value = true;
};

// Method to close the drawer programmatically
const closeDrawer = () => {
  isOpen.value = false;
};

// Expose methods to parent components
defineExpose({
  openDrawer,
  closeDrawer,
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
