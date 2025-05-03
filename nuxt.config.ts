// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  ssr: false,
  srcDir: "src/",
  imports: {
    dirs: ["composables", "services", "utils"],
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui", // Add Reka UI Nuxt module
  ],

  // // Disable auto-imports for now until we can fix the issues
  // imports: {
  //   autoImport: false
  // },

  // // Disable auto-component imports
  // components: false,

  // Global CSS
  css: ["~/styles/main.css"],
  vite: {
    plugins: [tailwindcss()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/styles/_colors.scss" as *;',
        },
      },
    },
  },
});
