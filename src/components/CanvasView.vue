<template>
  <div
    class="canvas-container"
    tabindex="0"
    ref="canvasContainerRef"
    @focus="setCanvasFocus(true)"
    @blur="setCanvasFocus(false)"
  >
    <div class="canvas-header">
      <div class="canvas-input-wrapper">
        <textarea
          ref="canvasInputRef"
          id="canvas-input"
          placeholder="Type a command..."
          v-model="canvasInput"
          @keydown.meta.k.prevent="focusChatInput"
          @keydown.arrow-left.prevent="moveToPreviousCluster"
          @keydown.arrow-right.prevent="moveToNextCluster"
        ></textarea>
        <button @click="closeCanvas">
          <i class="ph-bold ph-x"></i>
        </button>
      </div>
    </div>

    <div class="canvas-content">
      <div ref="canvasRef" class="canvas-workspace">
        <div
          v-for="(cluster, index) in clusters"
          :key="index"
          class="cluster"
          :class="{ active: activeClusterIndex === index }"
          :style="{
            left: `${cluster.x}px`,
            top: `${cluster.y}px`,
          }"
          @click="selectCluster(index)"
        >
          <div class="cluster-content" :class="`zoom-${zoomLevelIndex}`">
            <!-- Content conditionally rendered based on zoom level -->
            <template v-if="zoomLevelIndex === 1">
              <!-- Zoom Level 1: Minimal Summary (Node View) -->
              <div class="zoom-level-1">
                <div class="cluster-header">
                  <h3>{{ cluster.name }}</h3>
                  <div class="cluster-badge">{{ cluster.category }}</div>
                </div>
                <div class="cluster-stats">
                  <div class="stat-item">
                    <div class="stat-label">Items</div>
                    <div class="stat-value">{{ cluster.items.length }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">Status</div>
                    <div class="stat-value">{{ cluster.status }}</div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="zoomLevelIndex === 2">
              <!-- Zoom Level 2: Relationship View (Like the screenshot) -->
              <div class="zoom-level-2">
                <div class="cluster-header">
                  <h3>{{ cluster.name }}</h3>
                  <div class="cluster-badge">{{ cluster.category }}</div>
                </div>

                <div class="cluster-body">
                  <div class="cluster-summary">
                    <p>{{ cluster.summary }}</p>
                  </div>

                  <div class="cluster-relationships">
                    <div class="relation">
                      <span class="relation-label">created by</span>
                      <span class="relation-value">{{ cluster.creator }}</span>
                    </div>

                    <div class="relation">
                      <span class="relation-label">last updated</span>
                      <span class="relation-value">{{
                        cluster.lastUpdated
                      }}</span>
                    </div>

                    <div v-if="cluster.relatedTo.length > 0" class="relation">
                      <span class="relation-label">related to</span>
                      <span class="relation-value">{{
                        cluster.relatedTo.join(", ")
                      }}</span>
                    </div>
                  </div>

                  <div class="item-preview">
                    <div class="preview-header">Key Items:</div>
                    <div class="item-list">
                      <div
                        v-for="(item, i) in cluster.items.slice(0, 3)"
                        :key="i"
                        class="preview-item"
                      >
                        <div class="item-type-indicator" :class="item.type">
                          {{ item.type[0].toUpperCase() }}
                        </div>
                        <div class="item-title">{{ item.title }}</div>
                      </div>
                    </div>
                    <div v-if="cluster.items.length > 3" class="more-items">
                      +{{ cluster.items.length - 3 }} more items
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="zoomLevelIndex === 3">
              <!-- Zoom Level 3: Full Knowledge Graph View -->
              <div class="zoom-level-3">
                <div class="cluster-header">
                  <h3>{{ cluster.name }}</h3>
                  <div class="cluster-badge">{{ cluster.category }}</div>
                  <div
                    class="cluster-status"
                    :class="cluster.status.toLowerCase().replace(' ', '-')"
                  >
                    {{ cluster.status }}
                  </div>
                </div>

                <div class="cluster-body knowledge-graph">
                  <div class="central-concept">
                    <h4>{{ cluster.name }}</h4>
                    <p>{{ cluster.summary }}</p>
                  </div>

                  <div class="metadata-section">
                    <h5>Overview</h5>
                    <div class="metadata-grid">
                      <div class="metadata-item">
                        <div class="metadata-label">Created by</div>
                        <div class="metadata-value">{{ cluster.creator }}</div>
                      </div>
                      <div class="metadata-item">
                        <div class="metadata-label">Last updated</div>
                        <div class="metadata-value">
                          {{ cluster.lastUpdated }}
                        </div>
                      </div>
                      <div class="metadata-item">
                        <div class="metadata-label">Status</div>
                        <div class="metadata-value">{{ cluster.status }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="metrics-section">
                    <h5>Key Metrics</h5>
                    <div class="metrics-grid">
                      <div class="metric-item">
                        <div class="metric-value">
                          {{ cluster.keyMetrics.completion }}
                        </div>
                        <div class="metric-label">Completion</div>
                      </div>
                      <div class="metric-item">
                        <div class="metric-value">
                          {{ cluster.keyMetrics.priority }}
                        </div>
                        <div class="metric-label">Priority</div>
                      </div>
                      <div class="metric-item">
                        <div class="metric-value">
                          {{ cluster.keyMetrics.budget }}
                        </div>
                        <div class="metric-label">Budget</div>
                      </div>
                    </div>
                  </div>

                  <div class="relationships-section">
                    <h5>Relationships</h5>
                    <div class="relationship-links">
                      <div
                        v-for="(related, r) in cluster.relatedTo"
                        :key="r"
                        class="relationship-link"
                      >
                        <div class="link-arrow">→</div>
                        <div class="link-target">{{ related }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="items-section">
                    <h5>Items ({{ cluster.items.length }})</h5>
                    <div class="items-grid">
                      <div
                        v-for="(item, i) in cluster.items"
                        :key="i"
                        class="item-card"
                      >
                        <div class="item-header">
                          <div class="item-type-badge" :class="item.type">
                            {{ item.type }}
                          </div>
                          <div class="item-date">{{ item.date }}</div>
                        </div>
                        <h4 class="item-title">{{ item.title }}</h4>
                        <p class="item-description">{{ item.description }}</p>

                        <div class="item-details">
                          <div v-if="item.assignee" class="item-detail">
                            <span class="detail-label">Assignee:</span>
                            <span class="detail-value">{{
                              item.assignee
                            }}</span>
                          </div>
                          <div v-if="item.status" class="item-detail">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value">{{ item.status }}</span>
                          </div>
                          <div v-if="item.priority" class="item-detail">
                            <span class="detail-label">Priority:</span>
                            <span class="detail-value">{{
                              item.priority
                            }}</span>
                          </div>
                        </div>

                        <div
                          v-if="item.tags && item.tags.length > 0"
                          class="item-tags"
                        >
                          <span
                            v-for="(tag, t) in item.tags"
                            :key="t"
                            class="tag"
                            >{{ tag }}</span
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="zoom-controls">
      <button @click="zoomOut" :disabled="zoomLevelIndex === 1">-</button>
      <span>Level {{ zoomLevelIndex }}</span>
      <button @click="zoomIn" :disabled="zoomLevelIndex === 3">+</button>
    </div>

    <div class="keyboard-shortcuts">
      <div><kbd>⌘</kbd> + <kbd>K</kbd> Return to Chat</div>
      <div><kbd>←</kbd> <kbd>→</kbd> Navigate Clusters</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  onClose: () => void;
  chatInputRef: HTMLTextAreaElement | null;
}>();

// Refs
const canvasInputRef = ref<HTMLTextAreaElement | null>(null);
const canvasRef = ref<HTMLDivElement | null>(null);
const canvasContainerRef = ref<HTMLDivElement | null>(null);
const canvasInput = ref("");
const isCanvasFocused = ref(false);

// Zoom state - use a regular ref instead of useTransition
const zoomLevelIndex = ref(1); // 1, 2, or 3 directly
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

// For debugging
function logZoomState() {
  console.log(`Current zoom level: ${zoomLevelIndex.value}`);
}

// Cluster navigation
const activeClusterIndex = ref(0);

// Mock clusters data with enhanced relationship information
const clusters = ref([
  {
    name: "Project Alpha",
    summary: "Main development project with tasks and notes",
    category: "Development",
    creator: "Sarah Chen",
    lastUpdated: "2023-10-04",
    status: "In Progress",
    x: 100,
    y: 100,
    relatedTo: ["Project Gamma"], // Relationship to other clusters
    keyMetrics: {
      completion: "65%",
      priority: "High",
      budget: "$15,000",
    },
    items: [
      {
        title: "Implement login page",
        description: "Create a login page with username and password fields",
        date: "2023-10-01",
        type: "task",
        assignee: "Michael Rodriguez",
        status: "Completed",
        priority: "High",
        tags: ["frontend", "authentication"],
      },
      {
        title: "Design system review",
        description: "Review and consolidate design tokens across the app",
        date: "2023-10-02",
        type: "note",
        author: "Priya Sharma",
        tags: ["design", "UI"],
        relatedItems: ["API integration"],
      },
      {
        title: "API integration",
        description: "Connect authentication endpoints with the frontend",
        date: "2023-10-03",
        type: "task",
        assignee: "David Kim",
        status: "In Progress",
        priority: "Medium",
        tags: ["backend", "authentication"],
        dependsOn: ["Implement login page"],
      },
      {
        title: "User testing session",
        description: "Conduct user testing with 5 participants",
        date: "2023-10-04",
        type: "event",
        organizer: "Alex Thompson",
        attendees: ["Sarah Chen", "David Kim", "Priya Sharma"],
        location: "UX Lab",
        tags: ["research", "usability"],
      },
    ],
  },
  {
    name: "Project Beta",
    summary: "Secondary project focused on analytics",
    category: "Analytics",
    creator: "John Williams",
    lastUpdated: "2023-10-07",
    status: "Planning",
    x: 500,
    y: 300,
    relatedTo: ["Project Alpha"], // Relationship to other clusters
    keyMetrics: {
      completion: "30%",
      priority: "Medium",
      budget: "$8,000",
    },
    items: [
      {
        title: "Dashboard wireframes",
        description: "Create wireframes for the analytics dashboard",
        date: "2023-10-05",
        type: "task",
        assignee: "Priya Sharma",
        status: "In Progress",
        priority: "High",
        tags: ["design", "wireframes"],
      },
      {
        title: "Data visualization research",
        description: "Research best practices for data visualization",
        date: "2023-10-06",
        type: "note",
        author: "Elena Martinez",
        tags: ["research", "visualization"],
        insights: "Bar charts perform better than pie charts for our metrics",
      },
      {
        title: "Stakeholder meeting",
        description: "Present dashboard concepts to stakeholders",
        date: "2023-10-07",
        type: "event",
        organizer: "John Williams",
        attendees: ["CEO", "CTO", "Product Manager"],
        location: "Conference Room A",
        outcomes: "Approved for development with minor adjustments",
      },
    ],
  },
  {
    name: "Project Gamma",
    summary: "Research and development initiative",
    category: "Research",
    creator: "Elena Martinez",
    lastUpdated: "2023-10-12",
    status: "Active",
    x: 300,
    y: 600,
    relatedTo: ["Project Alpha"], // Relationship to other clusters
    keyMetrics: {
      completion: "45%",
      priority: "High",
      budget: "$20,000",
    },
    items: [
      {
        title: "Competitive analysis",
        description: "Analyze competing products in the market",
        date: "2023-10-08",
        type: "note",
        author: "John Williams",
        tags: ["research", "market"],
        keyFindings: [
          "Competitor A lacks mobile support",
          "Competitor B has superior analytics",
        ],
      },
      {
        title: "Prototype v1",
        description: "Build initial prototype for concept testing",
        date: "2023-10-09",
        type: "task",
        assignee: "David Kim",
        status: "Completed",
        priority: "Critical",
        tags: ["prototype", "development"],
      },
      {
        title: "Research findings",
        description: "Document findings from user research sessions",
        date: "2023-10-10",
        type: "note",
        author: "Sarah Chen",
        tags: ["research", "user testing"],
        insights: "Users struggle with the navigation structure",
      },
      {
        title: "Team brainstorming",
        description: "Collaborative session to generate ideas",
        date: "2023-10-11",
        type: "event",
        organizer: "Elena Martinez",
        attendees: ["Entire R&D team"],
        location: "Innovation Lab",
        outcomes: "15 new feature ideas documented",
      },
      {
        title: "Feature prioritization",
        description: "Prioritize features for the next development cycle",
        date: "2023-10-12",
        type: "task",
        assignee: "Elena Martinez",
        status: "In Progress",
        priority: "High",
        tags: ["planning", "product"],
      },
    ],
  },
]);

// Zoom controls
function zoomIn() {
  if (zoomLevelIndex.value < MAX_ZOOM) {
    // Simply increment zoom level
    zoomLevelIndex.value++;
    logZoomState();
  }
}

function zoomOut() {
  if (zoomLevelIndex.value > MIN_ZOOM) {
    // Simply decrement zoom level
    zoomLevelIndex.value--;
    logZoomState();
  }
}

// Cluster navigation
function moveToPreviousCluster() {
  if (activeClusterIndex.value > 0) {
    activeClusterIndex.value--;
  } else {
    activeClusterIndex.value = clusters.value.length - 1;
  }
}

function moveToNextCluster() {
  if (activeClusterIndex.value < clusters.value.length - 1) {
    activeClusterIndex.value++;
  } else {
    activeClusterIndex.value = 0;
  }
}

function selectCluster(index: number) {
  activeClusterIndex.value = index;
}

// Set canvas focus state
function setCanvasFocus(focused: boolean) {
  isCanvasFocused.value = focused;
}

// Focus on canvas input
function focusInput() {
  if (canvasInputRef.value) {
    canvasInputRef.value.focus();
  }
}

// Focus on chat input
function focusChatInput() {
  if (props.chatInputRef) {
    props.chatInputRef.focus();
  }
}

// Focus canvas container
function focusCanvasContainer() {
  if (canvasContainerRef.value) {
    canvasContainerRef.value.focus();
  }
}

// Close the canvas
function closeCanvas() {
  props.onClose();
}

// Cluster display adapts based on zoomLevelIndex computed property

// Focus on mount and initialize scroll position
onMounted(() => {
  if (canvasInputRef.value) {
    canvasInputRef.value.focus();
  }

  // Set canvas focus after a small delay
  setTimeout(() => {
    focusCanvasContainer();

    // Scroll to a central position to show clusters initially
    const canvasContent = document.querySelector(".canvas-content");
    if (canvasContent) {
      canvasContent.scrollLeft = 400;
      canvasContent.scrollTop = 300;
    }
  }, 100);

  // Log for debugging
  console.log("Canvas view mounted, scrolling should be enabled");
});
</script>

<style lang="scss" scoped>
@import "../styles/main.scss";

$primary-bg: $gray-100;
$container-bg: $white;
$border-color: $gray-300;
$accent-color: $orange-500;

.canvas-container {
  width: 100%;
  height: 600px;
  background-color: $gray-100;
  border-radius: 12px;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  z-index: 10;
  border: 1px solid $border-color;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  outline: none;

  &:focus {
    border-color: $accent-color;
    box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
  }
}

.canvas-header {
  padding: 15px;
  background-color: $container-bg;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.canvas-input-wrapper {
  width: 50%;
  position: relative;
  display: flex;
  align-items: center;

  textarea {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid $border-color;
    border-radius: 18px;
    resize: none;
    font-family: "Inter", sans-serif;
    font-size: 0.95rem;
    min-height: 48px;
    overflow-y: auto;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: $accent-color;
      box-shadow: 0 0 0 2px rgba($accent-color, 0.1);
    }
  }

  button {
    margin-left: 10px;
    width: 40px;
    height: 40px;
    background-color: $gray-200;
    color: $gray-600;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: $gray-300;
      color: $gray-800;
    }
  }
}

.canvas-content {
  flex: 1;
  position: relative;
  overflow: auto; /* Enable scrolling on both axes */
  cursor: grab; /* Indicate it's scrollable */
}

.canvas-content:active {
  cursor: grabbing; /* Change cursor when actively scrolling */
}

.canvas-workspace {
  position: relative; /* Changed from absolute to work with scrolling */
  width: 3000px;
  height: 2000px;
  transform-origin: top left;
}

.cluster {
  position: absolute; /* Keep absolute positioning within workspace */
  width: 320px;
  background-color: $white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  z-index: 1; /* Ensure clusters appear above the workspace */
  overflow: hidden;

  &:hover {
    box-shadow: 0 6px 28px rgba(0, 0, 0, 0.15);
    z-index: 2; /* Raise hovered clusters above others */
  }

  &.active {
    box-shadow: 0 0 0 2px $accent-color, 0 8px 30px rgba(0, 0, 0, 0.2);
    transform: translateY(-5px);
    z-index: 3; /* Active cluster gets highest z-index */
  }
}

.cluster-content {
  width: 100%;
  height: 100%;

  // Zoom level 1 (Minimal node view)
  &.zoom-1 {
    .cluster-header {
      background-color: $gray-100;
      padding: 15px;
      border-bottom: 1px solid $gray-200;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: $gray-900;
      }

      .cluster-badge {
        font-size: 0.7rem;
        background-color: $gray-200;
        color: $gray-800;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 500;
      }
    }

    .cluster-stats {
      padding: 15px;
      display: flex;
      justify-content: space-around;

      .stat-item {
        text-align: center;

        .stat-label {
          font-size: 0.7rem;
          color: $gray-600;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: $gray-900;
        }
      }
    }
  }

  // Zoom level 2 (Relationship view)
  &.zoom-2 {
    .cluster-header {
      background-color: $gray-100;
      padding: 15px;
      border-bottom: 1px solid $gray-200;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        margin: 0;
        font-size: 1.1rem;
        color: $gray-900;
      }

      .cluster-badge {
        font-size: 0.7rem;
        background-color: $gray-200;
        color: $gray-800;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 500;
      }
    }

    .cluster-body {
      padding: 15px;
    }

    .cluster-summary {
      margin-bottom: 15px;

      p {
        font-size: 0.85rem;
        color: $gray-700;
        margin: 0;
        line-height: 1.4;
      }
    }

    .cluster-relationships {
      margin-bottom: 20px;
      border-left: 2px solid $orange-300;
      padding-left: 12px;

      .relation {
        margin-bottom: 8px;
        font-size: 0.8rem;
        display: flex;
        align-items: baseline;

        &:last-child {
          margin-bottom: 0;
        }

        .relation-label {
          color: $gray-500;
          width: 80px;
          flex-shrink: 0;
        }

        .relation-value {
          font-weight: 500;
          color: $gray-800;
        }
      }
    }

    .item-preview {
      .preview-header {
        font-size: 0.8rem;
        color: $gray-600;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .item-list {
        margin-bottom: 8px;
      }

      .preview-item {
        display: flex;
        align-items: center;
        margin-bottom: 5px;
        font-size: 0.8rem;

        .item-type-indicator {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 8px;
          font-weight: 600;
          color: white;
          flex-shrink: 0;

          &.task {
            background-color: $orange-400; // blue shade
          }

          &.note {
            background-color: $orange-500; // green shade
          }

          &.event {
            background-color: $orange-600; // orange shade
          }
        }

        .item-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: $gray-800;
        }
      }

      .more-items {
        font-size: 0.75rem;
        color: $gray-500;
        font-style: italic;
      }
    }
  }

  // Zoom level 3 (Full knowledge graph)
  &.zoom-3 {
    width: 100%;

    .cluster-header {
      background-color: $gray-100;
      padding: 15px;
      border-bottom: 1px solid $gray-200;
      display: flex;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: $gray-900;
        margin-right: 12px;
      }

      .cluster-badge {
        font-size: 0.7rem;
        background-color: $gray-200;
        color: $gray-800;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 500;
        margin-right: auto;
      }

      .cluster-status {
        font-size: 0.7rem;
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 500;

        &.in-progress {
          background-color: $orange-100;
          color: $orange-700;
        }

        &.planning {
          background-color: $orange-100;
          color: $orange-600;
        }

        &.active {
          background-color: $orange-100;
          color: $orange-700;
        }

        &.completed {
          background-color: $orange-100;
          color: $orange-800;
        }
      }
    }

    .cluster-body {
      padding: 0 15px 15px;

      h5 {
        font-size: 0.9rem;
        color: $gray-700;
        margin: 20px 0 8px;
        font-weight: 600;
        border-bottom: 1px solid $gray-200;
        padding-bottom: 6px;
      }
    }

    .central-concept {
      background-color: $orange-100;
      border: 1px solid $orange-200;
      border-radius: 8px;
      padding: 12px;
      margin-top: 15px;

      h4 {
        margin: 0 0 6px;
        font-size: 1.1rem;
        color: $orange-800;
      }

      p {
        margin: 0;
        font-size: 0.85rem;
        color: $gray-700;
        line-height: 1.4;
      }
    }

    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;

      .metadata-item {
        .metadata-label {
          font-size: 0.7rem;
          color: $gray-500;
          margin-bottom: 2px;
        }

        .metadata-value {
          font-size: 0.85rem;
          color: $gray-800;
          font-weight: 500;
        }
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .metric-item {
        background-color: $gray-100;
        padding: 8px;
        border-radius: 6px;
        text-align: center;

        .metric-value {
          font-size: 1rem;
          font-weight: 600;
          color: $gray-900;
          margin-bottom: 2px;
        }

        .metric-label {
          font-size: 0.7rem;
          color: $gray-600;
        }
      }
    }

    .relationship-links {
      .relationship-link {
        display: flex;
        align-items: center;
        margin-bottom: 6px;
        font-size: 0.85rem;

        .link-arrow {
          color: $orange-500;
          margin-right: 8px;
          font-weight: bold;
        }

        .link-target {
          color: $gray-800;
          font-weight: 500;
        }
      }
    }

    .items-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-top: 10px;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 5px;

      .item-card {
        background-color: $white;
        border: 1px solid $gray-200;
        border-radius: 8px;
        padding: 12px;

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          .item-type-badge {
            font-size: 0.65rem;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
            color: white;

            &.task {
              background-color: $orange-400;
            }

            &.note {
              background-color: $orange-500;
            }

            &.event {
              background-color: $orange-600;
            }
          }

          .item-date {
            font-size: 0.7rem;
            color: $gray-500;
          }
        }

        .item-title {
          margin: 0 0 6px;
          font-size: 0.95rem;
          font-weight: 600;
          color: $gray-900;
        }

        .item-description {
          font-size: 0.8rem;
          color: $gray-700;
          margin: 0 0 10px;
          line-height: 1.4;
        }

        .item-details {
          margin-bottom: 8px;

          .item-detail {
            font-size: 0.75rem;
            margin-bottom: 3px;
            display: flex;

            .detail-label {
              color: $gray-600;
              width: 70px;
              flex-shrink: 0;
            }

            .detail-value {
              color: $gray-800;
              font-weight: 500;
            }
          }
        }

        .item-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;

          .tag {
            font-size: 0.65rem;
            background-color: $orange-100;
            color: $orange-800;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 500;
          }
        }
      }
    }
  }
}

.zoom-controls {
  position: fixed; /* Fixed position to stay on screen when scrolling */
  bottom: 20px;
  right: 20px;
  background-color: $white;
  border-radius: 20px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 10; /* Ensure it stays above canvas content */

  button {
    width: 30px;
    height: 30px;
    border: none;
    background-color: $gray-200;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      background-color: $gray-300;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  span {
    margin: 0 10px;
    font-size: 0.9rem;
    min-width: 60px;
    text-align: center;
  }
}

.keyboard-shortcuts {
  position: fixed; /* Fixed position to stay on screen when scrolling */
  bottom: 20px;
  left: 20px;
  background-color: $white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  font-size: 0.8rem;
  z-index: 10; /* Ensure it stays above canvas content */

  div {
    margin-bottom: 5px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  kbd {
    background-color: $gray-200;
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.8rem;
  }
}

// Zoom level specific styles
.zoom-1 {
  .zoom-level-1 {
    display: block;
  }
  .zoom-level-2,
  .zoom-level-3 {
    display: none;
  }
}

.zoom-2 {
  .zoom-level-1 {
    display: none;
  }
  .zoom-level-2 {
    display: block;
  }
  .zoom-level-3 {
    display: none;
  }
}

.zoom-3 {
  .zoom-level-1,
  .zoom-level-2 {
    display: none;
  }
  .zoom-level-3 {
    display: block;
  }
}
</style>
