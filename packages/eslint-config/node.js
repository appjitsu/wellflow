import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import turboPlugin from 'eslint-plugin-turbo';
import securityPlugin from 'eslint-plugin-security';
import noSecretsPlugin from 'eslint-plugin-no-secrets';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import importPlugin from 'eslint-plugin-import';
import onlyWarn from 'eslint-plugin-only-warn';

/**
 * A custom ESLint configuration for Node.js applications (like NestJS API).
 * Includes enhanced security rules for oil & gas backend services.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const nodeConfig = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  securityPlugin.configs.recommended,
  sonarjsPlugin.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      security: securityPlugin,
      'no-secrets': noSecretsPlugin,
      sonarjs: sonarjsPlugin,
      import: importPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Turbo rules
      'turbo/no-undeclared-env-vars': 'error',
      // Security rules - Critical for oil & gas applications
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',

      // Secrets detection - Prevent API keys, passwords in code
      'no-secrets/no-secrets': 'error',

      // NestJS and Express security patterns
      'no-process-env': 'warn', // Encourage using config service
      'no-process-exit': 'error',

      // Database security (for oil & gas data protection)
      'sonarjs/no-duplicate-string': ['error', 5], // Stricter for connection strings
      'sonarjs/cognitive-complexity': ['error', 12],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-redundant-boolean': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/no-useless-catch': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-object-literal': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',

      // API security rules
      'no-restricted-modules': [
        'error',
        {
          name: 'fs',
          message: 'Use fs/promises or fs-extra for better error handling.',
        },
        {
          name: 'child_process',
          message: 'Use safer alternatives or ensure proper input validation.',
        },
      ],

      // TypeScript strict rules for backend
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': 'error',

      // Error handling for production systems
      'prefer-promise-reject-errors': 'error',
      'no-throw-literal': 'error',

      // Performance and resource management
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'no-return-await': 'off', // Handled by @typescript-eslint/return-await

      // Oil & gas specific patterns
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
          message: 'setTimeout must have exactly 2 arguments for security.',
        },
        {
          selector: "CallExpression[callee.name='setInterval'][arguments.length!=2]",
          message: 'setInterval must have exactly 2 arguments for security.',
        },
        {
          selector: "CallExpression[callee.property.name='exec']",
          message: 'Avoid using exec(). Use execFile() or spawn() with proper validation.',
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  {
    // Configuration for test files
    files: ['**/*.test.{js,ts}', '**/*.spec.{js,ts}', '**/test/**/*', '**/__tests__/**/*'],
    rules: {
      // Relax some rules for test files
      'no-console': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'security/detect-object-injection': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-process-env': 'off', // Tests may need to access env vars directly
    },
  },
  {
    // Configuration for configuration files
    files: ['**/*.config.{js,ts}', '**/config/**/*', '**/.eslintrc.{js,ts}'],
    rules: {
      'security/detect-non-literal-require': 'warn',
      'import/no-dynamic-require': 'warn',
      'no-process-env': 'off', // Config files need env access
    },
  },
  {
    // Database migration and seed files
    files: ['**/migrations/**/*', '**/seeds/**/*', '**/database/**/*'],
    rules: {
      'sonarjs/no-duplicate-string': 'off', // SQL strings may be duplicated
      'security/detect-non-literal-fs-filename': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn', // Database schemas may use any
    },
  },
];

export default nodeConfig;
