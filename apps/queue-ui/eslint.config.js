import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/** @type {import("eslint").Linter.Config} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**'],
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow console statements in queue-ui (monitoring dashboard)
      'no-console': 'off',
    },
  },
];
