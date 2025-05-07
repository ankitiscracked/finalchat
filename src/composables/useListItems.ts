export function useListItems(itemCount: number) {
  const focusedIndex = ref(0);
  const selectedIndexes = ref<Set<number>>(new Set());
  const itemRefs = ref<HTMLElement[]>([]);

  function onKeyDown(e: KeyboardEvent) {
    if (itemCount === 0) return;

    if (e.key === "ArrowDown") {
      focusedIndex.value = (focusedIndex.value + 1) % itemCount;
      itemRefs.value[focusedIndex.value].focus();
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      focusedIndex.value = (focusedIndex.value - 1 + itemCount) % itemCount;
      itemRefs.value[focusedIndex.value].focus();
      e.preventDefault();
    } else if (e.key === "Enter") {
      toggleSelection(focusedIndex.value);
      e.preventDefault();
    }
  }

  function toggleSelection(index: number) {
    const newSet = new Set(selectedIndexes.value);

    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }

    selectedIndexes.value = newSet;
  }

  function setItemRef(index: number, el: HTMLElement) {
    itemRefs.value[index] = el;
  }

  onMounted(() => {
    if (itemCount > 0) {
      focusedIndex.value = 0;
      itemRefs.value[0].focus();
    }
  });

  return {
    focusedIndex,
    selectedIndexes,
    itemRefs,
    onKeyDown,
    setItemRef,
  };
}
