import { ref, watch, nextTick } from 'vue';

export function useSuggestions(textareaRef: any, newMessage: any, commandTypes: string[], specialCommands: string[]) {
  const suggestionText = ref("");
  
  // Watch for changes in the input message to update suggestion
  watch(newMessage, () => {
    updateSuggestion();
  });
  
  // Update the suggestion text based on current input and cursor position
  const updateSuggestion = () => {
    if (!textareaRef.value) return;
    
    const currentMessage = newMessage.value;
    const cursorPos = textareaRef.value.selectionStart;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    
    // Check for /show or /ai-overview command suggestions
    if (textBeforeCursor.match(/^\/show\s+$/) || textBeforeCursor.match(/^\/ai-overview\s+$/)) {
      // Suggest first command type
      suggestionText.value = commandTypes[0];
      return;
    }
    
    // Check for partial /show command type
    const showTypeMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
    if (showTypeMatch) {
      const partialType = showTypeMatch[1].toLowerCase();
      // Find matching command
      const matchingCommand = commandTypes.find(cmd => 
        cmd.startsWith(partialType) && cmd !== partialType
      );
      
      if (matchingCommand) {
        // Only suggest the remaining part of the command
        suggestionText.value = matchingCommand.substring(partialType.length);
      } else {
        suggestionText.value = "";
      }
      return;
    }
    
    // Check for partial /ai-overview command type
    const aiOverviewTypeMatch = textBeforeCursor.match(/^\/ai-overview\s+(\w*)$/);
    if (aiOverviewTypeMatch) {
      const partialType = aiOverviewTypeMatch[1].toLowerCase();
      // Find matching command
      const matchingCommand = commandTypes.find(cmd => 
        cmd.startsWith(partialType) && cmd !== partialType
      );
      
      if (matchingCommand) {
        // Only suggest the remaining part of the command
        suggestionText.value = matchingCommand.substring(partialType.length);
      } else {
        suggestionText.value = "";
      }
      return;
    }
    
    // Regular command suggestions (/)
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    const spaceAfterSlashIndex = textBeforeCursor.indexOf(" ", slashIndex);
    
    // Check if we're typing a command (after / but before a space)
    if (
      slashIndex !== -1 && 
      (spaceAfterSlashIndex === -1 || spaceAfterSlashIndex > cursorPos) &&
      !/\s/.test(textBeforeCursor.substring(slashIndex + 1)) // No space between / and cursor
    ) {
      const partialCommand = textBeforeCursor.substring(slashIndex + 1).toLowerCase();
      
      // First check for special commands
      const matchingSpecialCommand = specialCommands.find(cmd => 
        cmd.startsWith(partialCommand) && cmd !== partialCommand
      );
      
      if (matchingSpecialCommand) {
        // Only suggest the remaining part of the command
        suggestionText.value = matchingSpecialCommand.substring(partialCommand.length);
        return;
      }
      
      // If no special command matches, check regular item type commands
      const matchingCommand = commandTypes.find(cmd => 
        cmd.startsWith(partialCommand) && cmd !== partialCommand
      );
      
      if (matchingCommand) {
        // Only suggest the remaining part of the command
        suggestionText.value = matchingCommand.substring(partialCommand.length);
      } else {
        suggestionText.value = "";
      }
    } else {
      suggestionText.value = "";
    }
  };
  
  // Complete the command when Tab is pressed
  const completeCommand = () => {
    if (suggestionText.value) {
      const currentMessage = newMessage.value;
      const cursorPos = textareaRef.value?.selectionStart ?? currentMessage.length;
      const textBeforeCursor = currentMessage.substring(0, cursorPos);
      const textAfterCursor = currentMessage.substring(cursorPos);
      
      // Handle /show command completion
      const showMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
      if (showMatch) {
        const partialType = showMatch[1];
        const fullType = partialType + suggestionText.value;
        
        newMessage.value = 
          "/show " + fullType + 
          textAfterCursor;
        
        nextTick(() => {
          const newCursorPos = "/show ".length + fullType.length;
          textareaRef.value?.focus();
          textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
          suggestionText.value = "";
        });
        return;
      }
      
      // Handle /ai-overview command completion
      const aiOverviewMatch = textBeforeCursor.match(/^\/ai-overview\s+(\w*)$/);
      if (aiOverviewMatch) {
        const partialType = aiOverviewMatch[1];
        const fullType = partialType + suggestionText.value;
        
        newMessage.value = 
          "/ai-overview " + fullType + 
          textAfterCursor;
        
        nextTick(() => {
          const newCursorPos = "/ai-overview ".length + fullType.length;
          textareaRef.value?.focus();
          textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
          suggestionText.value = "";
        });
        return;
      }
      
      // Check if it's a special command (like close-overview)
      const specialCommandMatch = specialCommands.find(cmd => 
        textBeforeCursor === `/${cmd.substring(0, cmd.length - suggestionText.value.length)}`
      );
      
      if (specialCommandMatch) {
        // Complete the special command
        newMessage.value = 
          `/${specialCommandMatch}` + 
          textAfterCursor;
        
        nextTick(() => {
          const newCursorPos = specialCommandMatch.length + 1; // +1 for /
          textareaRef.value?.focus();
          textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
          suggestionText.value = "";
        });
        return;
      }
      
      // Regular command completion
      const slashIndex = textBeforeCursor.lastIndexOf("/");
      const partialCommand = textBeforeCursor.substring(slashIndex + 1);
      
      // Complete the command
      const fullCommand = partialCommand + suggestionText.value;
      newMessage.value = 
        currentMessage.substring(0, slashIndex) + 
        `/${fullCommand}` + 
        textAfterCursor;
      
      // Move cursor after the completed command
      nextTick(() => {
        const newCursorPos = slashIndex + fullCommand.length + 1; // +1 for /
        textareaRef.value?.focus();
        textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos);
        suggestionText.value = ""; // Clear suggestion
        
        // Add a space after the command if there isn't one already
        if (newMessage.value[newCursorPos] !== ' ' && !specialCommands.includes(fullCommand as any)) {
          newMessage.value = 
            newMessage.value.substring(0, newCursorPos) + 
            ' ' + 
            newMessage.value.substring(newCursorPos);
          
          // Move cursor after the space
          nextTick(() => {
            textareaRef.value?.setSelectionRange(newCursorPos + 1, newCursorPos + 1);
          });
        }
      });
    }
  };
  
  // Helper to get the typed part for suggestion overlay
  function getTypedPart(): string {
    if (!textareaRef.value) return "";
    
    const currentMessage = newMessage.value;
    const cursorPos = textareaRef.value.selectionStart;
    const textBeforeCursor = currentMessage.substring(0, cursorPos);
    
    // Check for /show command
    const showMatch = textBeforeCursor.match(/^\/show\s+(\w*)$/);
    if (showMatch) {
      return `/show ${showMatch[1]}`;
    }
    
    // Check for /ai-overview command
    const aiOverviewMatch = textBeforeCursor.match(/^\/ai-overview\s+(\w*)$/);
    if (aiOverviewMatch) {
      return `/ai-overview ${aiOverviewMatch[1]}`;
    }
    
    // Regular command
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    if (slashIndex !== -1) {
      return textBeforeCursor.substring(slashIndex);
    }
    
    return "";
  }
  
  return {
    suggestionText,
    updateSuggestion,
    completeCommand,
    getTypedPart
  };
}