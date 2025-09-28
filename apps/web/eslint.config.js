import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    ignores: ['next-env.d.ts'],
  },
  {
    files: ['components/ui/**/*.{ts,tsx}'],
    rules: {
      'sonarjs/deprecation': 'off',
      'sonarjs/prefer-read-only-props': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/table-header': 'off',
      'react/prop-types': 'off',
      'react/no-unknown-property': 'off',
    },
  },
];
