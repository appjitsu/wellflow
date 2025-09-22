// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import securityPlugin from 'eslint-plugin-security';
import noSecretsPlugin from 'eslint-plugin-no-secrets';
import sonarjsPlugin from 'eslint-plugin-sonarjs';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strict,
  eslintPluginPrettierRecommended,
  securityPlugin.configs.recommended,
  sonarjsPlugin.configs.recommended,
  {
    plugins: {
      security: securityPlugin,
      "no-secrets": noSecretsPlugin,
      // sonarjs plugin is already defined by sonarjsPlugin.configs.recommended
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // NestJS and oil & gas API specific rules
    rules: {
      // Security rules - Critical for oil & gas applications
      "security/detect-object-injection": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",
      "security/detect-buffer-noassert": "error",
      "security/detect-child-process": "error",
      "security/detect-disable-mustache-escape": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-require": "error",
      "security/detect-possible-timing-attacks": "error",
      "security/detect-pseudoRandomBytes": "error",

      // Secrets detection - Prevent API keys, passwords in code
      "no-secrets/no-secrets": "error",

      // TypeScript strict rules for production API
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // NestJS specific patterns
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],

      // Oil & gas data handling - SonarJS rules
      'sonarjs/cognitive-complexity': ['error', 12],
      'sonarjs/no-duplicate-string': ['error', { threshold: 4 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',

      // Additional security rules
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-process-env': 'warn', // Encourage using ConfigService

      // Suppress deprecation warnings for Zod methods (still functional in current version)
      'sonarjs/deprecation': 'off',
    },
  },
  {
    // Module files - NestJS requires these to be classes even when empty
    files: ['**/*.module.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    // Relax rules for test files - suppress unimportant test-specific warnings
    files: ['**/*.spec.ts', '**/*.test.ts', '**/test/**/*'],
    rules: {
      // TypeScript any-related rules - common in test mocks, suppress to reduce noise
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // Jest/testing patterns - suppress common test-specific warnings
      '@typescript-eslint/unbound-method': 'off', // Jest mocking patterns
      '@typescript-eslint/no-non-null-assertion': 'off', // Acceptable in test assertions
      '@typescript-eslint/no-extraneous-class': 'off', // Test mock classes

      // SonarJS rules - relax for test complexity
      'sonarjs/no-duplicate-string': 'off', // Test strings often duplicate
      'sonarjs/no-nested-functions': 'off', // Test structure complexity
      'sonarjs/cognitive-complexity': 'off', // Test complexity is acceptable

      // Environment rules
      'no-process-env': 'off', // Tests may need env vars
    },
  },
);