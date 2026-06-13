import fs from 'node:fs';
import path from 'node:path';

const SITE_TITLE = 'Flashcard';
const SITE_DESCRIPTION = 'Ứng dụng học flashcard giúp ghi nhớ hiệu quả và theo dõi tiến độ học tập ngay trên trình duyệt của bạn';
const VERSION = '1.0.0';
const BUILD_TIMESTAMP = Date.now();

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@vite-pwa/nuxt',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: '',
      siteTitle: SITE_TITLE,
      siteDescription: SITE_DESCRIPTION,
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
      name: SITE_TITLE,
      short_name: SITE_TITLE,
      description: SITE_DESCRIPTION,
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
