// @ts-check
import stylistic from '@stylistic/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt([
  stylistic.configs.recommended,
  stylistic.configs.customize({
    semi: true,
    braceStyle: '1tbs',
  }),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'vue/no-multiple-template-root': 'off',
      'vue/max-attributes-per-line': [
        'error',
        { singleline: 3 },
      ],
      'vue/html-indent': [
        'error',
        2,
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
]);
