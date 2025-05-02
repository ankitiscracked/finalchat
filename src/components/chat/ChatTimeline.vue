<template>
  <div class="chat-timeline" id="chat-timeline" ref="chatTimelineRef">
    <!-- Iterate over grouped timeline items -->
    <template v-if="groupedTimeline.length > 0">
      <div v-for="([date, items], index) in groupedTimeline" :key="date">
        <div class="date-separator">{{ date }}</div>
        <div
          v-for="item in items"
          :key="item.id"
          :class="['message-bubble', `message-${item.type}`]"
        >
          <div class="message-content">
            <i :class="getIconClass(item.type)" class="message-icon"></i>
            <div class="message-text">
              {{ item.content }}

              <!-- Show project for tasks with project -->
              <span
                v-if="item.type === 'task' && item.projectId"
                class="message-project"
              >
                <template v-if="getProjectNameWrapper(item.projectId)">
                  in
                  <span class="project-tag"
                    >#{{ getProjectNameWrapper(item.projectId) }}</span
                  >
                </template>
              </span>

              <span class="message-timestamp">{{
                formatTime(item.createdAt)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <!-- Show message if timeline is empty -->
    <p v-else-if="isTimeLineEmpty" class="empty-chat">
      Your timeline is empty. Add items below!
    </p>
    <!-- Keep loading text only initially -->
    <p v-else class="loading-chat">Loading timeline...</p>
  </div>
</template>

<script setup lang="ts">
import { getProjectName } from "../../services/projectService";
import { formatTime, getIconClass } from "../../services/timelineService";

const chatTimelineRef = ref<HTMLElement | null>(null);
const { allItemsGroupedByDate: groupedTimeline, isTimeLineEmpty } =
  useTimeline();
const { projects } = useProjects("");
// Project name getter wrapper
const getProjectNameWrapper = (projectId: number): string | null => {
  return getProjectName(projects.value, projectId);
};

watch(
  groupedTimeline,
  () => {
    scrollChatTimelineToBotton();
  },
  { deep: true }
);

async function scrollChatTimelineToBotton() {
  await nextTick();
  const timelineElement = chatTimelineRef.value;
  if (timelineElement) {
    timelineElement.scrollTop = timelineElement.scrollHeight;
  }
}
</script>

<style lang="scss" scoped>
@import "../../styles/main.scss";

// Colors from main app
$primary-bg: $gray-100;
$border-color: $gray-300;
$date-color: $gray-600;
$text-color: $gray-900;

$message-default-bg: $gray-200;
$message-task-bg: $orange-100;
$message-spend-bg: $orange-100;
$message-event-bg: $orange-100;

$message-task-accent: $orange-500;
$message-spend-accent: $orange-600;
$message-event-accent: $orange-700;
$message-default-accent: $gray-700;

.chat-timeline {
  flex-grow: 1;
  overflow-y: auto; // Allow scrolling for timeline content
  padding: 20px;
  border-bottom: 1px solid $border-color;
  background-color: $primary-bg;
  border-radius: 4px;

  .date-separator {
    text-align: center;
    color: $date-color;
    font-size: 0.85rem;
    font-weight: 600;
    padding: 5px 0;
  }

  .empty-chat,
  .loading-chat {
    text-align: center;
    color: $gray-600;
    margin-top: 40px;
  }

  .message-bubble {
    display: flex;
    margin-bottom: 15px;
    max-width: 85%;

    &.message-default,
    &.message-note {
      justify-content: end;
      margin-left: auto; // Right aligned
      .message-content {
        background-color: $message-default-bg;
        border-radius: 8px 8px 0px 8px;

        .message-icon {
          color: $message-default-accent;
        }
      }
    }

    &.message-task,
    &.message-spend,
    &.message-event {
      margin-right: auto; // Left aligned

      .message-content {
        border-radius: 8px 8px 0px 8px;
      }
    }

    &.message-task {
      .message-content {
        background-color: $message-task-bg;

        .message-icon {
          color: $message-task-accent;
        }
      }
    }

    &.message-spend {
      .message-content {
        background-color: $message-spend-bg;

        .message-icon {
          color: $message-spend-accent;
        }
      }
    }

    &.message-event {
      .message-content {
        background-color: $message-event-bg;

        .message-icon {
          color: $message-event-accent;
        }
      }
    }

    .message-content {
      padding: 12px 16px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

      .message-icon {
        font-size: 16px;
        margin-top: 2px;
      }

      .message-text {
        color: $text-color;
        word-wrap: break-word; // Ensure long words break
        font-size: 14px;
        line-height: 1.4;

        .message-project {
          font-size: 0.8rem;
          color: $gray-600;
          margin-top: 4px;
          display: block;

          .project-tag {
            background-color: rgba($orange-200, 0.7);
            padding: 2px 6px;
            border-radius: 4px;
            color: $orange-700;
            font-weight: 500;
          }
        }

        .message-timestamp {
          font-size: 0.75rem;
          color: $gray-500;
          margin-top: 5px;
          display: block; // Ensure it appears below content
        }
      }
    }
  }

  .message-bubble:last-child {
    margin-bottom: 0;
  }
}
</style>
