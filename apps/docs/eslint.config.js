import { nextJsConfig } from '@repo/eslint-config/next-js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    // Docs-specific overrides
    files: ['**/*.tsx', '**/*.ts'],
    rules: {
      // Allow Vercel deployment URLs in docs
      'no-secrets/no-secrets': 'off',
    },
  },
  {
    // Next.js generated files
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
