import fs from 'node:fs';
import path from 'node:path';

const VERSION = '1.0.0';
const BUILD_TIMESTAMP = Date.now();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
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
      version: VERSION,
      buildTimestamp: BUILD_TIMESTAMP,
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

  pwa: {
    manifest: {
      name: 'Flashcard',
      short_name: 'Flashcard',
      description: 'Ứng dụng học flashcard giúp ghi nhớ hiệu quả và theo dõi tiến độ học tập ngay trên trình duyệt của bạn',
      lang: 'vi',
      icons: [
        {
          src: 'apple-touch-icon.png',
          type: 'image/png',
          sizes: '250x250',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,json}'],
    },
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
        '@vueuse/integrations/useSortable',
        'rxdb',
        'rxdb/plugins/cleanup',
        'rxdb/plugins/json-dump',
        'rxdb/plugins/leader-election',
        'rxdb/plugins/query-builder',
        'rxdb/plugins/storage-dexie',
        'rxdb/plugins/update',
        'rxjs',
        'rxjs/operators',
        'zod',
        'zod/v4/core',
      ],
    },
  },

  hooks: {
    // Generate the static JSON file containing the buildId in the public directory
    'nitro:init': (nitro) => {
      const data = {
        version: VERSION,
        buildId: nitro.options.runtimeConfig.app.buildId,
        timestamp: BUILD_TIMESTAMP,
      };

      const rootPublicDir = path.resolve('public');

      fs.writeFileSync(
        path.join(rootPublicDir, 'version.json'),
        JSON.stringify(data, null),
      );
    },
  },
});
