// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
  ],

  devtools: {
    enabled: true,
  },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: '',
      version: '1.0.0',
      databaseSchemaVersion: 0,
      buildVersion: Date.now(),
    },
  },

  pages: {
    pattern: [
      '**/*.vue',
      '!**/_components/**',
      '!**/_utils/**',
      '!**/_composables/**',
      '!**/*.test.{js,ts,mts,mjs,vue}',
    ],
  },

  routeRules: {
    '/api/**': {
      cors: true,
    },
  },

  compatibilityDate: '2024-07-11',

  vite: {
    optimizeDeps: {
      // Pre-bundle certain dependencies on startup to avoid page reloads
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'rxdb',
        'rxdb/plugins/query-builder',
        'rxdb/plugins/storage-dexie',
        'rxdb/plugins/update',
        'zod',
      ],
    },
  },
});
