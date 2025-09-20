import securityPlugin from "eslint-plugin-security";
import noSecretsPlugin from "eslint-plugin-no-secrets";
import sonarjsPlugin from "eslint-plugin-sonarjs";

/**
 * Enhanced security ESLint configuration for oil & gas production monitoring applications.
 * This configuration enforces enterprise-grade security standards required for critical infrastructure.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const securityConfig = [
  securityPlugin.configs.recommended,
  sonarjsPlugin.configs.recommended,
  {
    plugins: {
      security: securityPlugin,
      "no-secrets": noSecretsPlugin,
      sonarjs: sonarjsPlugin,
    },
    rules: {
      // === CRITICAL SECURITY RULES ===
      // These rules are essential for oil & gas applications handling sensitive data

      // Code Injection Prevention
      "security/detect-object-injection": "error",
      "security/detect-eval-with-expression": "error",
      "security/detect-non-literal-regexp": "error",
      "security/detect-unsafe-regex": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",

      // File System Security
      "security/detect-non-literal-fs-filename": "error",
      "security/detect-non-literal-require": "error",

      // Process Security
      "security/detect-child-process": "error",
      "security/detect-buffer-noassert": "error",

      // Cryptographic Security
      "security/detect-pseudoRandomBytes": "error",
      "security/detect-possible-timing-attacks": "error",

      // Web Security
      "security/detect-disable-mustache-escape": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "no-script-url": "error",

      // Secrets and Sensitive Data
      "no-secrets/no-secrets": "error",

      // === CODE QUALITY RULES FOR SECURITY ===
      // These rules improve code quality which indirectly enhances security

      // Complexity Management
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": ["error", 3],
      "sonarjs/no-identical-functions": "error",

      // Error Handling
      "sonarjs/no-useless-catch": "error",
      "sonarjs/no-ignored-return": "error",

      // Code Clarity
      "sonarjs/no-redundant-boolean": "error",
      "sonarjs/prefer-immediate-return": "error",
      "sonarjs/prefer-object-literal": "error",
      "sonarjs/prefer-single-boolean-return": "error",

      // Resource Management
      "sonarjs/no-unused-collection": "error",

      // === RESTRICTED PATTERNS ===
      // Patterns that are dangerous in production environments

      "no-restricted-globals": [
        "error",
        {
          name: "event",
          message: "Use local parameter instead of global event object.",
        },
        {
          name: "fdescribe",
          message: "Do not commit fdescribe. Use describe instead.",
        },
        {
          name: "fit",
          message: "Do not commit fit. Use it instead.",
        },
      ],

      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.name='setTimeout'][arguments.length!=2]",
          message: "setTimeout must have exactly 2 arguments for security.",
        },
        {
          selector: "CallExpression[callee.name='setInterval'][arguments.length!=2]",
          message: "setInterval must have exactly 2 arguments for security.",
        },
      ],

      "no-restricted-properties": [
        "error",
        {
          object: "document",
          property: "write",
          message: "document.write is not allowed for security reasons.",
        },
        {
          object: "document",
          property: "writeln",
          message: "document.writeln is not allowed for security reasons.",
        },
        {
          object: "window",
          property: "eval",
          message: "window.eval is not allowed for security reasons.",
        },
      ],

      // === PROTOTYPE POLLUTION PREVENTION ===
      "no-proto": "error",
      "no-iterator": "error",

      // === ADDITIONAL SECURITY HARDENING ===
      "no-console": "warn", // Allow console in development, warn in production
      "no-debugger": "error",
      "no-alert": "error",
      "no-confirm": "error",
      "no-prompt": "error",
    },
  },
  {
    // Oil & Gas specific overrides for development environments
    files: ["**/*.test.{js,ts,tsx}", "**/*.spec.{js,ts,tsx}", "**/test/**/*"],
    rules: {
      // Relax some rules for test files
      "no-console": "off",
      "sonarjs/no-duplicate-string": "off",
      "security/detect-object-injection": "warn",
    },
  },
  {
    // Configuration files can have more relaxed rules
    files: ["**/*.config.{js,ts}", "**/config/**/*", "**/.eslintrc.{js,ts}"],
    rules: {
      "security/detect-non-literal-require": "warn",
      "import/no-dynamic-require": "warn",
    },
  },
];

export default securityConfig;
