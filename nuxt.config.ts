// https://nuxt.com/docs/api/configuration/nuxt-config
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    'reka-ui/nuxt', // Add Reka UI Nuxt module
  ],

  // Removed Vite configuration for 'path' alias
})
