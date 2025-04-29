import { ref, computed, nextTick } from "vue";
import type { Ref } from "vue";

export interface NavigationState {
  isActive: boolean;
  currentIndex: number;
  currentItemId: number | null;
}

export interface NavigationOptions<T> {
  inputRef?: Ref<HTMLElement | null>;
  onAction?: (item: T, actionKey: string, event: KeyboardEvent) => void;
}

export function useNavigation<T extends { id?: number | null }>(
  items: Ref<T[]>,
  options: NavigationOptions<T> = {}
) {
  const { chatInputTextAreaRef } = useGlobalElementAffordances();
  // Shared state for focus/navigation
  const navigationState = ref<NavigationState>({
    isActive: false,
    currentIndex: -1,
    currentItemId: null,
  });

  // Track selected item IDs
  const selectedItemIds = ref<number[]>([]);

  // Track DOM references to items
  const itemRefs = ref<(HTMLElement | undefined)[]>([]);

  // Current item based on navigation state
  const currentItem = computed<T | null>(() => {
    if (
      navigationState.value.currentIndex >= 0 &&
      navigationState.value.currentIndex < items.value.length
    ) {
      return items.value[navigationState.value.currentIndex];
    }
    return null;
  });

  // Set ref for an item at specific index
  const setItemRef = (el: HTMLElement | null, index: number) => {
    if (el) {
      itemRefs.value[index] = el;
    } else {
      itemRefs.value[index] = undefined;
    }
  };

  // Activate navigation mode
  const activateNavigation = () => {
    if (items.value.length === 0) {
      return;
    }

    navigationState.value.isActive = true;
    navigationState.value.currentIndex = 0;
    navigationState.value.currentItemId = items.value[0].id || null;

    // Focus the first item element
    nextTick(() => {
      if (itemRefs.value.length > 0 && itemRefs.value[0]) {
        itemRefs.value[0].focus();
      }
    });
  };

  // Navigate to next/previous item
  const navigate = (direction: 1 | -1) => {
    if (!navigationState.value.isActive || items.value.length === 0) return;

    const newIndex = navigationState.value.currentIndex + direction;

    // Check bounds
    if (newIndex >= 0 && newIndex < items.value.length) {
      navigationState.value.currentIndex = newIndex;
      navigationState.value.currentItemId = items.value[newIndex].id || null;

      // Focus the DOM element
      nextTick(() => {
        const itemElement = itemRefs.value[newIndex];
        if (itemElement) {
          itemElement.focus();
        }
      });
    }
  };

  // Deactivate navigation and optionally return focus to input
  const deactivateNavigation = () => {
    navigationState.value.isActive = false;
    navigationState.value.currentIndex = -1;
    navigationState.value.currentItemId = null;

    // Return focus to input if provided
    nextTick(() => {
      chatInputTextAreaRef.value?.focus();
    });
  };

  // Toggle selection for an item
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

  // Clear all selected items
  const clearSelection = () => {
    selectedItemIds.value = [];
  };

  // Handle keyboard events for navigation and selection
  const handleKeydown = (event: KeyboardEvent) => {
    if (!navigationState.value.isActive) return false;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        navigate(1);
        return true;

      case "ArrowUp":
        event.preventDefault();
        navigate(-1);
        return true;

      case "Escape":
        event.preventDefault();
        deactivateNavigation();
        return true;

      case "Enter":
        event.preventDefault();
        if (navigationState.value.currentItemId !== null) {
          toggleSelection(navigationState.value.currentItemId);
        }
        return true;

      // Action keys - delegate to callback if provided
      case " ":
      case "Spacebar":
      case "e":
        event.preventDefault();
        if (currentItem.value && options.onAction) {
          options.onAction(currentItem.value, event.key, event);
          return true;
        }
        return false;

      default:
        return false;
    }
  };

  // Get the index of an item
  const getItemIndex = (item: T) => {
    return items.value.findIndex((i) => i.id === item.id);
  };

  // Focus a specific item by ID
  const focusItemById = (itemId: number) => {
    const index = items.value.findIndex((item) => item.id === itemId);
    if (index >= 0) {
      navigationState.value.currentIndex = index;
      navigationState.value.currentItemId = itemId;
      navigationState.value.isActive = true;

      nextTick(() => {
        const itemElement = itemRefs.value[index];
        if (itemElement) {
          itemElement.focus();
        }
      });
    }
  };

  return {
    navigationState,
    selectedItemIds,
    itemRefs,
    currentItem,
    setItemRef,
    activateNavigation,
    navigate,
    deactivateNavigation,
    toggleSelection,
    clearSelection,
    handleKeydown,
    getItemIndex,
    focusItemById,
  };
}
