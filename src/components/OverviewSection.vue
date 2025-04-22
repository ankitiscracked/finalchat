<template>
  <div class="overview-section">
    <div class="overview-header">
      <div class="header-left">
        <h2>{{ capitalizeFirst(type) }} Overview</h2>
        <div class="mode-selector" v-if="mode === 'standard'">
          <button @click="$emit('changeMode', 'ai')" class="ai-button">
            <i class="ph-bold ph-robot"></i> AI Overview
          </button>
        </div>
        <div class="mode-selector" v-else>
          <button @click="$emit('changeMode', 'standard')" class="standard-button">
            <i class="ph-bold ph-list"></i> Standard View
          </button>
        </div>
      </div>
      <button @click="$emit('close')" class="close-button">
        <i class="ph-bold ph-x"></i>
      </button>
    </div>
    
    <!-- Standard overview mode -->
    <div v-if="mode === 'standard'" class="overview-content">
      <template v-if="groupedItems.length > 0">
        <div v-for="([date, items], index) in groupedItems" :key="date">
          <div class="date-separator">{{ date }}</div>
          <div
            v-for="item in items"
            :key="item.id"
            :class="['overview-item', `item-${item.type}`]"
          >
            <span class="item-icon">
              <i :class="getIconClass(item.type)"></i>
            </span>
            <div class="item-content">
              {{ item.content }}
              <span class="item-timestamp">{{ formatTime(item.createdAt) }}</span>
            </div>
          </div>
        </div>
      </template>
      <p v-else class="empty-overview">No {{ type }} items found.</p>
    </div>
    
    <!-- AI overview mode -->
    <div v-else class="overview-content ai-content">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Generating AI overview...</p>
      </div>
      
      <div v-else-if="aiContent" class="ai-overview">
        <div class="ai-summary">
          <p>{{ aiContent.summary }}</p>
        </div>
        
        <div class="ai-insights" v-if="aiContent.insights.length > 0">
          <h3>Insights & Actions</h3>
          <ul>
            <li v-for="(insight, index) in aiContent.insights" :key="index">
              {{ insight }}
            </li>
          </ul>
        </div>
      </div>
      
      <div v-else class="ai-overview empty-overview">
        <p>No AI overview available. Try adding more {{ type }} items.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimelineItemRecord } from '../services/indexedDB';

// Define props
const props = defineProps<{
  items: TimelineItemRecord[];
  type: string;
  mode: 'standard' | 'ai';
  isLoading?: boolean;
  aiContent?: { summary: string; insights: string[] } | null;
}>();

// Define emits
defineEmits(['close', 'changeMode']);

// Helper function to format date
function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Helper function to format time
function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper to get icon class based on type
function getIconClass(type: string): string {
  switch (type) {
    case "task":
      return "ph-bold ph-check-circle";
    case "spend":
      return "ph-bold ph-currency-dollar";
    case "event":
      return "ph-bold ph-calendar";
    case "note":
      return "ph-bold ph-note-pencil";
    default:
      return "ph-bold ph-chat-text";
  }
}

// Helper to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Group items by date
const groupedItems = computed(() => {
  const filteredItems = props.items.filter(item => item.type === props.type);
  const groups: Record<string, TimelineItemRecord[]> = {};
  
  filteredItems.forEach((item) => {
    const dateStr = formatDate(item.createdAt);
    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(item);
  });
  
  // Return as an array of [date, items] pairs, sorted chronologically (newest first)
  return Object.entries(groups).sort((a, b) => {
    const dateA = new Date(a[0]);
    const dateB = new Date(b[0]);
    return dateB.getTime() - dateA.getTime(); // Reverse order (newest first)
  });
});
</script>

<style lang="scss" scoped>
@import "../../styles/main.scss";

// Overview colors
$overview-bg: $white;
$border-color: $gray-300;
$header-bg: $gray-100;
$text-color: $gray-900;
$date-color: $gray-600;
$ai-color: $orange-600;

.overview-section {
  background-color: $overview-bg;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid $border-color;
  background-color: $header-bg;
  
  .header-left {
    display: flex;
    align-items: center;
    
    h2 {
      margin: 0;
      font-size: 1.4rem;
      margin-right: 15px;
      font-weight: 600;
      color: $gray-800;
    }
    
    .mode-selector {
      button {
        background-color: $white;
        border: 1px solid $border-color;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        font-family: 'Inter', sans-serif;
        
        i {
          margin-right: 8px;
          font-size: 1.1rem;
        }
        
        &:hover {
          background-color: $gray-200;
        }
        
        &.ai-button {
          color: $orange-700;
          i {
            color: $orange-700;
          }
          &:hover {
            background-color: rgba($orange-100, 0.8);
          }
        }
        
        &.standard-button {
          color: $gray-700;
          i {
            color: $gray-700;
          }
        }
      }
    }
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: $gray-600;
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      color: $gray-800;
    }
  }
}

.overview-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px;
  
  .date-separator {
    text-align: center;
    margin: 15px 0;
    color: $date-color;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 5px 0;
  }
  
  .empty-overview {
    text-align: center;
    color: $gray-600;
    margin-top: 40px;
  }
  
  .overview-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15px;
    padding: 12px 16px;
    border-radius: 10px;
    background-color: $gray-100;
    
    .item-icon {
      margin-right: 12px;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .item-content {
      flex-grow: 1;
      color: $text-color;
      word-wrap: break-word;
      font-size: 0.95rem;
      line-height: 1.4;
    }
    
    .item-timestamp {
      font-size: 0.75rem;
      color: $gray-500;
      margin-top: 5px;
      display: block;
    }
    
    // Type-specific styles
    &.item-task {
      border-left: 4px solid $orange-500;
      .item-icon {
        color: $orange-500;
      }
    }
    &.item-spend {
      border-left: 4px solid $orange-600;
      .item-icon {
        color: $orange-600;
      }
    }
    &.item-event {
      border-left: 4px solid $orange-700;
      .item-icon {
        color: $orange-700;
      }
    }
    &.item-note {
      border-left: 4px solid $orange-400;
      .item-icon {
        color: $orange-400;
      }
    }
    &.item-default {
      border-left: 4px solid $gray-700;
      .item-icon {
        color: $gray-700;
      }
    }
  }
  
  // AI Overview specific styles
  &.ai-content {
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba($orange-300, 0.2);
        border-radius: 50%;
        border-top-color: $orange-500;
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 20px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      p {
        color: $orange-700;
        font-weight: 500;
      }
    }
    
    .ai-overview {
      padding: 10px;
      
      .ai-summary {
        margin-bottom: 20px;
        font-size: 1.1rem;
        line-height: 1.5;
        color: $text-color;
      }
      
      .ai-insights {
        background-color: rgba($orange-100, 0.5);
        padding: 15px 20px;
        border-radius: 10px;
        border-left: 4px solid $orange-500;
        
        h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: $orange-700;
          font-size: 1.1rem;
          font-weight: 600;
        }
        
        ul {
          margin: 0;
          padding-left: 20px;
          
          li {
            margin-bottom: 10px;
            line-height: 1.4;
            color: $gray-800;
            
            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }
  }
}
</style>