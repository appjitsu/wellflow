/**
 * Lighthouse CI Configuration for WellFlow
 *
 * Configures automated performance testing for oil & gas production monitoring platform.
 * Ensures compliance with industry performance standards and Core Web Vitals.
 *
 * Industry Standards:
 * - NIST Cybersecurity Framework: Performance Monitoring
 * - IEC 62443: Industrial System Performance Requirements
 * - API 1164: Pipeline SCADA Performance Standards
 */

const fs = require('fs');
const path = require('path');

/**
 * Dynamically discover available routes from Next.js application structure
 */
function discoverRoutes() {
  const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:3000';
  let routes = [];

  // Try to discover from Next.js structure
  const appDir = path.join(process.cwd(), 'apps/web/app');
  const pagesDir = path.join(process.cwd(), 'apps/web/src/pages');

  if (fs.existsSync(appDir)) {
    console.log('📋 Discovering routes from Next.js app directory...');
    routes = discoverNextJsAppRoutes(appDir, baseUrl);
  } else if (fs.existsSync(pagesDir)) {
    console.log('📋 Discovering routes from Next.js pages directory...');
    routes = discoverNextJsPagesRoutes(pagesDir, baseUrl);
  }

  // Fallback to default routes if discovery fails
  if (routes.length === 0) {
    console.log('⚠️ Route discovery failed, using default routes');
    routes = [`${baseUrl}`, `${baseUrl}/api-test`, `${baseUrl}/monitoring-test`];
  }

  console.log(`🎯 Discovered ${routes.length} routes for performance testing:`);
  routes.forEach((route) => console.log(`   - ${route}`));

  return routes;
}

/**
 * Discover routes from Next.js app directory structure
 */
function discoverNextJsAppRoutes(appDir, baseUrl, basePath = '') {
  const routes = [];

  if (!fs.existsSync(appDir)) {
    return routes;
  }

  const entries = fs.readdirSync(appDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const routePath = basePath === '' && entry.name === 'app' ? '' : `${basePath}/${entry.name}`;
      const fullPath = path.join(appDir, entry.name);

      // Check if this directory has a page.tsx or page.js file
      const hasPage =
        fs.existsSync(path.join(fullPath, 'page.tsx')) ||
        fs.existsSync(path.join(fullPath, 'page.js'));

      if (hasPage) {
        const finalPath = routePath || '/';
        routes.push(`${baseUrl}${finalPath}`);
      }

      // Recursively check subdirectories (only if no page file found to avoid duplicates)
      if (!hasPage) {
        routes.push(...discoverNextJsAppRoutes(fullPath, baseUrl, routePath));
      }
    }
  }

  return routes;
}

/**
 * Discover routes from Next.js pages directory structure
 */
function discoverNextJsPagesRoutes(pagesDir, baseUrl, basePath = '') {
  const routes = [];

  if (!fs.existsSync(pagesDir)) {
    return routes;
  }

  const entries = fs.readdirSync(pagesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.js'))) {
      // Skip API routes and special files
      if (entry.name.startsWith('_') || entry.name === 'api') continue;

      const fileName = entry.name.replace(/\.(tsx|js)$/, '');
      const routePath = fileName === 'index' ? basePath || '/' : `${basePath}/${fileName}`;

      routes.push(`${baseUrl}${routePath}`);
    } else if (entry.isDirectory() && !entry.name.startsWith('_') && entry.name !== 'api') {
      const subPath = `${basePath}/${entry.name}`;
      routes.push(...discoverNextJsPagesRoutes(path.join(pagesDir, entry.name), baseUrl, subPath));
    }
  }

  return routes;
}

module.exports = {
  ci: {
    collect: {
      // Dynamically discover URLs to test
      url: discoverRoutes(),

      // Number of runs for each URL to get consistent results
      numberOfRuns: 3,

      // Chrome flags for consistent testing environment
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],

      // Settings for consistent performance testing
      settings: {
        // Throttling settings to simulate real-world conditions
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },

        // Device emulation for mobile testing
        emulatedFormFactor: 'desktop',

        // Skip certain audits that may not be relevant
        skipAudits: ['canonical', 'robots-txt', 'tap-targets'],

        // Only run performance and accessibility audits
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
      },
    },

    assert: {
      // Performance budget assertions based on performance-budget.json
      assertions: {
        // Core Web Vitals thresholds
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],

        // Specific performance metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        interactive: ['error', { maxNumericValue: 3800 }],

        // Resource size budgets
        'total-byte-weight': ['error', { maxNumericValue: 614400 }], // 600KB
        'dom-size': ['warn', { maxNumericValue: 1500 }],

        // Network and loading performance
        'server-response-time': ['error', { maxNumericValue: 500 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 3 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unused-javascript': ['warn', { maxNumericValue: 20000 }],

        // Accessibility requirements for oil & gas compliance
        'color-contrast': 'error',
        'image-alt': 'error',
        label: 'error',
        'link-name': 'error',
        'button-name': 'error',

        // Best practices for security and reliability
        'is-on-https': 'off', // Disabled for local testing
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
      },
    },

    upload: {
      // Configure where to store results
      target: 'filesystem',
      outputDir: './lighthouse-reports',

      // Optionally upload to Lighthouse CI server
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },

    server: {
      // Configuration for starting local server during CI
      command: 'pnpm run build && pnpm run start',
      port: 3000,

      // Wait for server to be ready
      waitForServer: {
        timeout: 60000,
        retries: 5,
        retryDelay: 5000,
      },
    },
  },

  // Custom configuration for oil & gas industry requirements
  industryConfig: {
    oilAndGas: {
      // Critical infrastructure performance requirements
      criticalInfrastructure: {
        maxLoadTime: 3000,
        maxResponseTime: 1000,
        minAvailability: 99.9,
      },

      // Field operations requirements
      fieldOperations: {
        mobileOptimized: true,
        lowBandwidthSupport: true,
        offlineCapability: false,
      },

      // Emergency response requirements
      emergencyResponse: {
        maxResponseTime: 1000,
        highAvailability: true,
        failoverSupport: true,
      },

      // Regulatory compliance requirements
      regulatoryCompliance: {
        auditTrail: true,
        performanceMonitoring: true,
        dataRetention: 7, // years
      },
    },
  },

  // Custom budgets that align with performance-budget.json
  customBudgets: [
    {
      path: '/*',
      resourceSizes: [
        { resourceType: 'script', budget: 500 }, // 500KB JavaScript
        { resourceType: 'stylesheet', budget: 100 }, // 100KB CSS
        { resourceType: 'image', budget: 200 }, // 200KB images
        { resourceType: 'font', budget: 50 }, // 50KB fonts
        { resourceType: 'total', budget: 600 }, // 600KB total
      ],
      resourceCounts: [
        { resourceType: 'script', budget: 10 },
        { resourceType: 'stylesheet', budget: 5 },
        { resourceType: 'image', budget: 20 },
        { resourceType: 'font', budget: 3 },
      ],
    },
  ],

  // Reporting configuration
  reporting: {
    formats: ['html', 'json'],
    outputPath: './lighthouse-reports',

    // Custom report generation
    customReports: {
      oilGasCompliance: {
        enabled: true,
        template: 'oil-gas-compliance-template.html',
        includeMetrics: ['performance', 'accessibility', 'best-practices', 'core-web-vitals'],
      },
    },
  },
};
