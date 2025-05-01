export interface NavigationState {
  isActive: boolean;
  currentIndex: number;
  currentItemId: number | null;
}

const navigationState = ref<NavigationState>({
  isActive: false,
  currentIndex: -1,
  currentItemId: null,
});

const selectedItemIds = ref<number[]>([]);

export function useGlobalContext() {
  const toggleSelection = (itemId: number) => {
    const index = selectedItemIds.value.indexOf(itemId);
    if (index === -1) {
      // Add to selection
      selectedItemIds.value = [...selectedItemIds.value, itemId];
    } else {
      // Remove from selection
      selectedItemIds.value = selectedItemIds.value.filter(
        (id) => id !== itemId
      );
    }
  };

  const clearSelection = () => {
    selectedItemIds.value = [];
  };

  return {
    navigationState,
    toggleSelection,
    clearSelection,
    selectedItemIds,
  };
}
