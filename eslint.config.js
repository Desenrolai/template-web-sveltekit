import js from '@eslint/js';
import sveltePlugin from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteParser from 'svelte-eslint-parser';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: ['.svelte-kit/**', 'build/**', 'coverage/**', 'node_modules/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...sveltePlugin.configs['flat/recommended'],

  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: { parser: tseslint.parser },
      globals: { ...globals.browser },
    },
  },

  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // Convenção do projeto: zero `any`.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];

export default config;
