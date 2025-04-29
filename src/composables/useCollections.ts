import { ref, nextTick } from "vue";
import type { CollectionRecord } from "../services/indexedDB";
import {
  loadCollections,
  createCollection,
  findCollectionByName,
} from "../services/collectionService";

export function useCollections(newMessage: any) {
  const { chatInputTextAreaRef: textareaRef } = useGlobalElementAffordances();
  const showCollectionPopover = ref(false);
  const collectionPopoverPosition = ref<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const currentCollection = ref<CollectionRecord | null>(null);
  const collections = ref<CollectionRecord[]>([]);

  // Load collections from database
  const loadCollectionsData = async () => {
    try {
      collections.value = await loadCollections();
      console.log(`Loaded ${collections.value.length} collections`);
    } catch (error) {
      console.error("Error loading collections:", error);
      collections.value = [];
    }
  };

  // Function to check for collection tags in input
  const checkForCollectionTag = () => {
    if (!textareaRef.value) {
      console.log("checkForCollectionTag: textareaRef is null");
      return;
    }

    const message = newMessage.value;
    const cursorPos = textareaRef.value.selectionStart;

    console.log("checkForCollectionTag called:", {
      message,
      cursorPos,
      isEventOrNoteCmd: /^\/(event|note)\s+/i.test(message),
    });

    // Check if we're typing within an event or note command - look at the text before cursor
    const textBeforeCursor = message.substring(0, cursorPos);
    const isEventOrNoteCommand = /^\/(event|note|default)\s+/i.test(
      textBeforeCursor
    );

    console.log("Event/Note command check:", {
      textBeforeCursor,
      isEventOrNoteCommand,
    });

    if (!isEventOrNoteCommand) {
      console.log("Not in an event or note command");
      if (showCollectionPopover.value) {
        closeCollectionPopover();
      }
      return;
    }

    // Look for @ character before cursor position
    const atIndex = textBeforeCursor.lastIndexOf("@");

    console.log("@ check:", {
      atIndex,
      textBeforeCursor,
      popoverVisible: showCollectionPopover.value,
    });

    if (atIndex !== -1 && !showCollectionPopover.value) {
      // Make sure the @ is not part of another word
      const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : "";
      const isValidAtPosition = charBeforeAt === "" || /\s/.test(charBeforeAt);

      console.log("@ validation:", {
        charBeforeAt,
        isValidAtPosition,
      });

      if (isValidAtPosition) {
        // Position the popover next to the @ character
        calculatePopoverPosition(atIndex);
        showCollectionPopover.value = true;
        console.log("Popover shown", {
          position: collectionPopoverPosition.value,
        });
      }
    } else if (atIndex === -1 && showCollectionPopover.value) {
      // Close popover if there's no @ anymore
      console.log("No @ found, closing popover");
      closeCollectionPopover();
    }
  };

  // Calculate popover position based on cursor position
  const calculatePopoverPosition = (atIndex: number) => {
    if (!textareaRef.value) return;

    // Create a hidden div to measure text width
    const measureDiv = document.createElement("div");
    measureDiv.style.position = "absolute";
    measureDiv.style.visibility = "hidden";
    measureDiv.style.whiteSpace = "pre";
    measureDiv.style.fontSize = window.getComputedStyle(
      textareaRef.value
    ).fontSize;
    measureDiv.style.fontFamily = window.getComputedStyle(
      textareaRef.value
    ).fontFamily;
    measureDiv.style.letterSpacing = window.getComputedStyle(
      textareaRef.value
    ).letterSpacing;

    // Measure text width up to the @ character
    measureDiv.textContent = newMessage.value.substring(0, atIndex);
    document.body.appendChild(measureDiv);

    // Get coordinates
    const textareaRect = textareaRef.value.getBoundingClientRect();
    const textWidth = measureDiv.offsetWidth;

    // Calculate line height and line breaks
    const lineHeight = parseInt(
      window.getComputedStyle(textareaRef.value).lineHeight
    );
    const offsetLeft = Math.min(textWidth, textareaRef.value.clientWidth - 280); // Prevent overflow

    // Clean up
    document.body.removeChild(measureDiv);

    // Update popover position - position it above cursor position with some padding
    collectionPopoverPosition.value = {
      top: textareaRect.top - 5 - lineHeight, // Position just above cursor line
      left: textareaRect.left + offsetLeft, // Align with cursor
    };
  };

  // Close collection popover
  const closeCollectionPopover = () => {
    showCollectionPopover.value = false;
  };

  // Handle collection selection
  const selectCollection = async (collection: CollectionRecord) => {
    if (!textareaRef.value) return;

    // Store the selected collection
    currentCollection.value = collection;

    // Update collections list if it's a new collection
    if (!collections.value.some((c) => c.id === collection.id)) {
      collections.value.push(collection);
    }

    // Close the popover
    closeCollectionPopover();

    // First, check if there's already a collection tag in the message
    const message = newMessage.value;
    const existingCollectionMatch = message.match(/\s+in\s+@\S+$/i);

    if (existingCollectionMatch) {
      // If there's already a collection tag, replace it with the new one
      newMessage.value =
        message
          .substring(0, message.length - existingCollectionMatch[0].length)
          .trim() +
        " in @" +
        collection.name;
    } else {
      // If no existing collection, find the @ the user was typing
      const cursorPos = textareaRef.value.selectionStart;
      const textBeforeCursor = message.substring(0, cursorPos);
      const atIndex = textBeforeCursor.lastIndexOf("@");

      if (atIndex !== -1) {
        // Remove partial collection tag (@something)
        const textAfterAt = message.substring(atIndex);
        const spaceIndex = textAfterAt.search(/\s/);
        const endOfAtWord =
          spaceIndex !== -1 ? atIndex + spaceIndex : message.length;

        // Get the cleaned message without the partial collection tag
        const cleanedMessage =
          message.substring(0, atIndex) +
          (spaceIndex !== -1 ? message.substring(endOfAtWord) : "");

        // Append collection at the end
        newMessage.value = cleanedMessage.trim() + " in @" + collection.name;
      } else {
        // Just append to the end if no @ was found
        newMessage.value = message.trim() + " in @" + collection.name;
      }
    }

    // Focus back to input and place cursor at the end
    nextTick(() => {
      if (textareaRef.value) {
        textareaRef.value.focus();
        // Place cursor at the end of the input
        textareaRef.value.selectionStart = textareaRef.value.value.length;
        textareaRef.value.selectionEnd = textareaRef.value.value.length;
      }
    });
  };

  // Extract collection from content
  const extractCollectionFromContent = (
    content: string
  ): { cleanContent: string; collectionId?: number } => {
    let cleanContent = content;
    let collectionId: number | undefined = undefined;

    // Look for "in @collection-name" pattern at the end
    const collectionMatch = content.match(/\s+in\s+@(\S+)$/i);
    if (collectionMatch && collectionMatch[1]) {
      const collectionName = collectionMatch[1];

      // Find collection by name
      const collection = findCollectionByName(
        collections.value,
        collectionName
      );
      if (collection) {
        collectionId = collection.id;
        // Remove the collection tag from the content
        cleanContent = content
          .substring(0, content.length - collectionMatch[0].length)
          .trim();
      }
    }

    return { cleanContent, collectionId };
  };

  // Create and select a new collection
  const createAndSelectCollection = async (name: string) => {
    try {
      const newCollection = await createCollection(name);
      selectCollection(newCollection);
    } catch (error) {
      console.error("Error creating collection:", error);
    }
  };

  return {
    showCollectionPopover,
    collectionPopoverPosition,
    currentCollection,
    collections,
    loadCollectionsData,
    checkForCollectionTag,
    closeCollectionPopover,
    selectCollection,
    extractCollectionFromContent,
    createAndSelectCollection,
  };
}
