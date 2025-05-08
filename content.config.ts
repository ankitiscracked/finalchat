import { defineCollection, defineContentConfig } from "@nuxt/content";
import path from "node:path";

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: "page",
      source: "**/*.md",
    }),
  },
});
