<template>
  <div
    class="border rounded-sm border-stone-200 overflow-auto"
    id="chat-timeline"
    ref="chatTimelineRef"
  >
    <!-- Iterate over grouped timeline items -->
    <template v-if="groupedTimeline.length > 0">
      <div
        class="p-4 overflow-scroll"
        v-for="[date, items] in groupedTimeline"
        :key="date"
      >
        <div class="flex justify-center p-2">
          <span class="text-sm text-stone-500">{{ date }}</span>
        </div>
        <div class="flex flex-col gap-4">
          <div
            v-for="item in items"
            :key="item.id"
            :class="[
              'flex py-2 px-3 border-stone-200 border max-w-max rounded-t-md rounded-bl-md',
              `message-${item.type}`,
            ]"
          >
            <div class="flex flex-col gap-1">
              <div class="flex gap-2 items-start">
                <UIcon
                  v-if="item.type === 'task'"
                  name="i-ph-check-circle-bold"
                  size="18"
                  class="text-stone-500"
                />
                <UIcon
                  v-if="item.type === 'note' || item.type === 'default'"
                  name="i-ph-note-bold"
                  size="18"
                  class="text-stone-500"
                />
                <div class="flex flex-col gap-2">
                  <span class="text-sm text-stone-800">
                    {{ item.content }}</span
                  >
                  <span class="text-xs text-stone-500">{{
                    formatTime(item.createdAt)
                  }}</span>

                  <span
                    v-if="item.type === 'task' && item.projectId"
                    class="text-xs"
                  >
                    in
                    <span
                      class="rounded-sm border border-stone-300 py-0.5 px-1"
                    >
                      {{ getProjectNameWrapper(item.projectId) }}</span
                    >
                  </span>
                </div>
              </div>

              <!-- Show project for tasks with project -->
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
import { formatTime, getIconClass } from "../../services/timelineService";

const chatTimelineRef = ref<HTMLElement | null>(null);
const { allItemsGroupedByDate: groupedTimeline, isTimeLineEmpty } =
  useTimeline();
const { getProjectName } = useProjects("");
// Project name getter wrapper
const getProjectNameWrapper = (projectId: number): string | null => {
  return getProjectName(projectId);
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

<style scoped>
@reference "../../styles/main.css";

.message-default,
.message-note {
  @apply bg-stone-100 ml-auto;
}
</style>
