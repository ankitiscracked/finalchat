import { ref, nextTick } from "vue";

const chatTimelineRef = ref<HTMLElement | null>(null);
const chatInputRef = ref<HTMLElement | null>(null);
const chatInputTextAreaRef = ref<HTMLTextAreaElement | null>(null);
const overviewSectionRef = ref<HTMLElement | null>(null);
const commandsDrawerRef = ref<HTMLElement | null>(null);
const showCanvas = ref(false);

export function useGlobalElementAffordances() {
  function setGlobalElementRef(
    el: HTMLElement | null,
    type:
      | "chatInput"
      | "chatInputTextArea"
      | "chatTimeline"
      | "overviewSection"
      | "commandDrawer"
  ) {
    if (type === "chatInput") {
      chatInputRef.value = el;
    }
    if (type === "chatTimeline") {
      chatTimelineRef.value = el;
    }
    if (type === "overviewSection") {
      overviewSectionRef.value = el;
    }
    if (type === "commandDrawer") {
      commandsDrawerRef.value = el;
    }
    if (type === "chatInputTextArea") {
      chatInputTextAreaRef.value = el as HTMLTextAreaElement;
    }
  }

  function clearGlobalRefs() {
    chatInputRef.value = null;
    chatInputTextAreaRef.value = null;
    chatTimelineRef.value = null;
    overviewSectionRef.value = null;
    commandsDrawerRef.value = null;
  }

  function toggleShowCanvas(value: boolean) {
    showCanvas.value = value;
  }

  async function scrollChatTimelineToBotton() {
    await nextTick();
    const timelineElement = chatTimelineRef.value;
    if (timelineElement) {
      timelineElement.scrollTop = timelineElement.scrollHeight;
    }
  }

  return {
    chatInputRef,
    chatInputTextAreaRef,
    chatTimelineRef,
    overviewSectionRef,
    commandsDrawerRef,
    setGlobalElementRef,
    clearGlobalRefs,
    toggleShowCanvas,
    scrollChatTimelineToBotton,
  };
}
