import { onKeyStroke, useMagicKeys } from "@vueuse/core";

export function useEventListeners() {
  const { chatInputTextAreaRef, commandsDrawerRef } =
    useGlobalElementAffordances();

  onKeyStroke(["k"], (e) => {
    if (e.metaKey || e.ctrlKey) {
      const textarea = chatInputTextAreaRef.value;
      if (textarea) {
        textarea.focus();
        e.preventDefault();
      }
    }
  });

  // Add a listener for double space to open the commands drawer
  const { space } = useMagicKeys();
  const lastSpaceTime = ref(0);
  const DOUBLE_PRESS_THRESHOLD = 500; // ms

  watch(space, () => {
    // Don't trigger if an input field is focused
    if (
      document.activeElement?.tagName === "INPUT" ||
      document.activeElement?.tagName === "TEXTAREA"
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastSpaceTime.value < DOUBLE_PRESS_THRESHOLD) {
      // Open the commands drawer
      if (commandsDrawerRef.value) {
        commandsDrawerRef.value.openDrawer();
      }
      lastSpaceTime.value = 0; // Reset to prevent multiple triggers
    } else {
      lastSpaceTime.value = now;
    }
  });
}
