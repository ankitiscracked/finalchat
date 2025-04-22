// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    'reka-ui/nuxt', // Add Reka UI Nuxt module
  ],

  // Disable auto-imports for now until we can fix the issues
  imports: {
    autoImport: false
  },

  // Disable auto-component imports
  components: false,

  // Global CSS
  css: [
    '~/styles/main.scss',
  ]
})
