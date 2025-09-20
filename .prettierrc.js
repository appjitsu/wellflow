/**
 * Prettier configuration for WellFlow oil & gas production monitoring platform.
 * Ensures consistent code formatting across the entire monorepo.
 *
 * @type {import("prettier").Config}
 */
module.exports = {
  // Core formatting rules
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  // Bracket and spacing rules
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  // End of line handling (important for cross-platform development)
  endOfLine: 'lf',

  // Quote handling
  quoteProps: 'as-needed',
  jsxSingleQuote: true,

  // Prose formatting
  proseWrap: 'preserve',

  // HTML formatting
  htmlWhitespaceSensitivity: 'css',

  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',

  // File-specific overrides for oil & gas development
  overrides: [
    {
      // TypeScript and JavaScript files
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      options: {
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        printWidth: 100,
        tabWidth: 2,
      },
    },
    {
      // JSON files (configuration, package.json, etc.)
      files: ['*.json'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        trailingComma: 'none',
      },
    },
    {
      // Markdown files (documentation)
      files: ['*.md', '*.mdx'],
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      // YAML files (Docker, CI/CD, etc.)
      files: ['*.yml', '*.yaml'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        singleQuote: false, // YAML prefers double quotes
      },
    },
    {
      // CSS and SCSS files
      files: ['*.css', '*.scss', '*.sass'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        singleQuote: true,
      },
    },
    {
      // HTML files
      files: ['*.html'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      // SQL files (for database migrations and queries)
      files: ['*.sql'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        // SQL formatting will be handled by specific SQL formatters
      },
    },
    {
      // Configuration files that need special handling
      files: [
        '.eslintrc.js',
        '.eslintrc.cjs',
        'eslint.config.js',
        'eslint.config.mjs',
        'prettier.config.js',
        'tailwind.config.js',
        'next.config.js',
        'jest.config.js',
        'turbo.json',
      ],
      options: {
        printWidth: 100,
        tabWidth: 2,
        singleQuote: true,
        trailingComma: 'es5',
      },
    },
    {
      // Package.json files need special formatting
      files: ['package.json'],
      options: {
        printWidth: 120,
        tabWidth: 2,
        trailingComma: 'none',
        // Keep package.json compact but readable
      },
    },
  ],

  // Plugin configurations
  plugins: [
    // Add plugins as needed for specific file types
    // '@trivago/prettier-plugin-sort-imports', // Uncomment if import sorting is needed
  ],

  // Import sorting configuration (if plugin is enabled)
  // importOrder: [
  //   '^react$',
  //   '^next',
  //   '^@nestjs',
  //   '<THIRD_PARTY_MODULES>',
  //   '^@/',
  //   '^[./]',
  // ],
  // importOrderSeparation: true,
  // importOrderSortSpecifiers: true,
};
