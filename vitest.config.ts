import { defineVitestConfig } from '@nuxt/test-utils/config';
import { resolve } from 'path';

export default defineVitestConfig({
  resolve: {
    alias: {
      '~': resolve(__dirname, 'app'),
    },
  },
  test: {
    globals: true,
    environment: 'nuxt',
    hookTimeout: 60000,
    coverage: {
      provider: 'v8',
      reporter: ['html'],
      reportsDirectory: '.coverage',
    },
  },
});
