<template>
  <div class="project-popover" :style="positionStyle">
    <div class="popover-header">
      <h3>{{ projects.length ? "Select project" : "Create a project" }}</h3>
    </div>
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>Loading projects...</span>
    </div>
    <div v-else class="popover-content">
      <div v-if="projects.length > 0" class="project-list">
        <div
          v-for="(project, index) in projects"
          :key="project.id"
          class="project-item"
          @click="selectProject(project)"
          tabindex="0"
          ref="projectItemRefs"
          @keydown.enter="selectProject(project)"
          @keydown.tab="focusNewProjectInput"
        >
          <span class="project-name">#{{ project.name }}</span>
        </div>
      </div>
      <div
        class="new-project-form"
        :class="{ 'with-projects': projects.length > 0 }"
      >
        <input
          ref="newProjectInputRef"
          v-model="newProjectName"
          placeholder="New project name..."
          class="new-project-input"
          @keydown.enter.prevent="createProject"
          @keydown.esc="$emit('close')"
          @keydown.shift.tab="focusLastProject"
          autofocus
        />
        <button
          @click="createProject"
          class="create-project-btn"
          :disabled="!newProjectName.trim()"
        >
          Add
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createProject as addProject,
  loadProjects as getAllProjects,
} from "../../services/projectService";
const props = defineProps<{
  position?: { top: number; left: number };
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", project: ProjectRecord): void;
  (e: "create", project: ProjectRecord): void;
}>();

const projects = ref<ProjectRecord[]>([]);
const loading = ref(true);
const newProjectName = ref("");
const newProjectInputRef = ref<HTMLInputElement | null>(null);
const projectItemRefs = ref<HTMLElement[]>([]);

// Computed style for positioning the popover
const positionStyle = computed(() => {
  if (!props.position) return {};
  return {
    top: `${props.position.top}px`,
    left: `${props.position.left}px`,
  };
});

// Load projects from IndexedDB
const loadProjects = async () => {
  loading.value = true;
  // Ensure new project name is cleared
  newProjectName.value = "";
  try {
    projects.value = await getAllProjects();
  } catch (error) {
    console.error("Error loading projects:", error);
  } finally {
    loading.value = false;
    // Focus logic after loading
    nextTick(() => {
      // If there are projects, focus the first one
      if (
        projects.value.length > 0 &&
        projectItemRefs.value &&
        projectItemRefs.value.length > 0
      ) {
        // Focus the first project item
        projectItemRefs.value[0]?.focus();
      }
      // Otherwise, focus the new project input
      else if (newProjectInputRef.value) {
        newProjectInputRef.value.focus();
      }
    });
  }
};

// Create a new project
const createProject = async () => {
  const name = newProjectName.value.trim();
  if (!name) return;

  try {
    const newProject = await addProject(name);

    // Emit create event with the new project
    emit("create", newProject);

    // Clear the input field
    newProjectName.value = "";

    // Emit close event to close the popover after creation
    emit("close");
  } catch (error) {
    console.error("Error creating project:", error);
    // Show error to user if needed
  }
};

// Select an existing project
const selectProject = (project: ProjectRecord) => {
  // Emit select event with the project
  emit("select", project);

  // Emit close event to close the popover after selection
  emit("close");
};

// Function to focus the "new project" input
const focusNewProjectInput = (event: KeyboardEvent) => {
  // Prevent default tab behavior
  event.preventDefault();

  // Focus the new project input
  if (newProjectInputRef.value) {
    newProjectInputRef.value.focus();
  }
};

// Function to focus the last project (for shift+tab from input)
const focusLastProject = (event: KeyboardEvent) => {
  // Prevent default shift+tab behavior
  event.preventDefault();

  // Only focus if there are projects and refs
  if (projectItemRefs.value && projectItemRefs.value.length > 0) {
    // Focus the last project item
    const lastItem = projectItemRefs.value[projectItemRefs.value.length - 1];
    if (lastItem) {
      lastItem.focus();
    }
  }
};

// Load projects when component is mounted
onMounted(() => {
  loadProjects();
});
</script>

<style lang="scss" scoped>
// Colors
$popover-bg: $white;
$border-color: $gray-300;
$text-color: $gray-800;
$accent-color: $orange-500;
$accent-hover: $orange-600;
$item-hover-bg: $gray-100;

.project-popover {
  position: absolute;
  width: 280px;
  background-color: $popover-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;

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

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 25px;

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid rgba($accent-color, 0.2);
      border-radius: 50%;
      border-top-color: $accent-color;
      animation: spin 0.8s linear infinite;
      margin-bottom: 10px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    span {
      font-size: 0.85rem;
      color: $gray-600;
    }
  }

  .popover-content {
    max-height: 300px;
    overflow-y: auto;

    .project-list {
      padding: 5px 0;

      .project-item {
        padding: 10px 15px;
        cursor: pointer;
        transition: background-color 0.2s;
        outline: none;

        &:hover,
        &:focus {
          background-color: $item-hover-bg;
        }

        &:focus {
          box-shadow: inset 0 0 0 2px rgba($accent-color, 0.4);
        }

        .project-name {
          font-size: 0.9rem;
          color: $accent-color;
          font-weight: 500;
        }
      }
    }

    .new-project-form {
      padding: 12px 15px;
      display: flex;
      gap: 8px;

      &.with-projects {
        border-top: 1px solid $border-color;
      }

      .new-project-input {
        flex-grow: 1;
        padding: 8px 12px;
        border: 1px solid $border-color;
        border-radius: 4px;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          border-color: $accent-color;
          box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
        }
      }

      .create-project-btn {
        padding: 8px 12px;
        background-color: $accent-color;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: $accent-hover;
        }

        &:disabled {
          background-color: $gray-400;
          cursor: not-allowed;
        }
      }
    }
  }
}
</style>
