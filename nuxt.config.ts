import { fileURLToPath } from 'node:url'; // Needed for resolving shim path

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  // Add Vite configuration
  vite: {
    resolve: {
      alias: {
        // Alias the 'path' module to our empty shim for browser builds
        'path': fileURLToPath(new URL('./shims/path.mjs', import.meta.url)),
      }
    }
  }
})
