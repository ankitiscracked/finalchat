import { ref } from 'vue';
import type { TimelineItemRecord } from '../services/indexedDB';

export function useAiOverview() {
  const aiOverviewLoading = ref(false);
  const aiOverviewContent = ref<{summary: string; insights: string[]} | null>(null);
  
  // Function to generate AI overview content
  async function generateAiOverview(type: string, items: TimelineItemRecord[]): Promise<void> {
    // Reset previous content and show loading state
    aiOverviewContent.value = null;
    aiOverviewLoading.value = true;
    
    try {
      // Filter items by type and last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const filteredItems = items.filter(item => 
        item.type === type && 
        item.createdAt >= oneWeekAgo
      );
      
      if (filteredItems.length === 0) {
        aiOverviewContent.value = {
          summary: `No ${type} items found from the past week.`,
          insights: []
        };
        aiOverviewLoading.value = false;
        return;
      }
      
      // Simulate AI API call with a timeout
      // In a real app, this would be an actual API call to Gemini API
      setTimeout(() => {
        // For demonstration purposes, generate a sample response
        // This would normally come from the AI API
        const summaryText = `Here's a summary of your ${type}s from the past week.`;
        const insightsList = generateMockInsights(type, filteredItems);
        
        aiOverviewContent.value = {
          summary: summaryText,
          insights: insightsList
        };
        
        aiOverviewLoading.value = false;
      }, 1500); // Simulate API delay
    } catch (error) {
      console.error("Error generating AI overview:", error);
      aiOverviewContent.value = {
        summary: "Failed to generate AI overview. Please try again.",
        insights: []
      };
      aiOverviewLoading.value = false;
    }
  }
  
  // Helper function to generate mock insights for demo purposes
  function generateMockInsights(type: string, items: TimelineItemRecord[]): string[] {
    // Get unique content from items to use as basis for insights
    const contents = items.map(item => item.content);
    
    switch (type) {
      case "task":
        return [
          "You've completed 60% of your tasks this week",
          "Most of your tasks were added on weekdays",
          "Consider breaking larger tasks into smaller, manageable chunks",
          "Try setting specific deadlines for outstanding tasks"
        ];
        
      case "spend":
        return [
          "Your total spending this week was higher than average",
          "Most expenses were in the 'groceries' category",
          "Consider setting a budget for discretionary spending",
          "You've reduced restaurant spending compared to last week"
        ];
        
      case "event":
        return [
          "You have 3 recurring weekly events",
          "Most of your events occur in the afternoon",
          "Try blocking focused work time between meetings",
          "Consider consolidating similar events to free up time"
        ];
        
      default:
        return [
          "Keep track of your activities to get more detailed insights",
          "Try using specific commands to categorize your entries",
          "Regular entries help build a more accurate overview"
        ];
    }
  }
  
  return {
    aiOverviewLoading,
    aiOverviewContent,
    generateAiOverview
  };
}