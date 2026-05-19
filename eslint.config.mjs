// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';
import stylistic from '@stylistic/eslint-plugin';

export default withNuxt({
  plugins: { '@stylistic': stylistic },
  rules: {
    'vue/no-multiple-template-root': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 3 }],
    '@stylistic/indent': ['error', 2],
    'vue/html-indent': ['error', 2],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/brace-style': ['error', '1tbs'],
    '@stylistic/semi': ['error', 'always'],
  },
});
