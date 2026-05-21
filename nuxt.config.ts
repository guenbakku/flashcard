// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-07-11',

  runtimeConfig: {
    public: {
      siteUrl: '',
      version: '1.0.0',
      databaseSchemaVersion: 0,
    },
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  routeRules: {
    '/api/**': {
      cors: true,
    },
  },

  vite: {
    optimizeDeps: {
      // Pre-bundle certain dependencies on startup to avoid page reloads
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'rxdb',
        'rxdb/plugins/storage-dexie',
        'zod',
      ],
    },
  },
});
