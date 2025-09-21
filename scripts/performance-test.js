#!/usr/bin/env node

/**
 * WellFlow Performance Testing Script
 * Comprehensive performance testing for oil & gas production monitoring platform
 * Tests Core Web Vitals, bundle sizes, and industry-specific performance requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Performance testing configuration
const PERFORMANCE_CONFIG = {
  baseUrl:
    process.env.LIGHTHOUSE_BASE_URL || `http://localhost:${process.env.NEXT_PUBLIC_PORT || 3000}`,
  tools: {
    lighthouse: true,
    bundleAnalyzer: true,
    coreWebVitals: true,
  },
  budgets: {
    // Oil & gas industry performance requirements
    totalBundleSize: 600 * 1024, // 600KB total
    firstContentfulPaint: 1800, // 1.8s
    largestContentfulPaint: 2500, // 2.5s
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1, // 0.1
    speedIndex: 3000, // 3s
    timeToInteractive: 3800, // 3.8s
  },
  industry: {
    // Critical infrastructure requirements
    criticalInfrastructure: true,
    fieldOperations: true,
    emergencyResponse: true,
    lowBandwidth: true,
  },
};

/**
 * Dynamically discover available routes from Next.js application structure
 */
function discoverRoutes() {
  let routes = [];

  // Try to discover from Next.js structure
  const appDir = path.join(process.cwd(), 'apps/web/app');
  const pagesDir = path.join(process.cwd(), 'apps/web/src/pages');

  if (fs.existsSync(appDir)) {
    console.log('📋 Discovering routes from Next.js app directory...');
    routes = discoverNextJsAppRoutes(appDir);
  } else if (fs.existsSync(pagesDir)) {
    console.log('📋 Discovering routes from Next.js pages directory...');
    routes = discoverNextJsPagesRoutes(pagesDir);
  }

  // Fallback to default routes if discovery fails
  if (routes.length === 0) {
    console.log('⚠️ Route discovery failed, using default routes');
    routes = [
      { url: PERFORMANCE_CONFIG.baseUrl, name: 'home', path: '/' },
      { url: `${PERFORMANCE_CONFIG.baseUrl}/api-test`, name: 'api-test', path: '/api-test' },
      {
        url: `${PERFORMANCE_CONFIG.baseUrl}/monitoring-test`,
        name: 'monitoring-test',
        path: '/monitoring-test',
      },
    ];
  }

  console.log(`🎯 Discovered ${routes.length} routes for performance testing:`);
  routes.forEach((route) => console.log(`   - ${route.name}: ${route.url}`));

  return routes;
}

/**
 * Discover routes from Next.js app directory structure
 */
function discoverNextJsAppRoutes(appDir, basePath = '') {
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
        routes.push({
          url: `${PERFORMANCE_CONFIG.baseUrl}${finalPath}`,
          name: entry.name === 'app' || finalPath === '/' ? 'home' : entry.name,
          path: finalPath,
        });
      }

      // Recursively check subdirectories (only if no page file found to avoid duplicates)
      if (!hasPage) {
        routes.push(...discoverNextJsAppRoutes(fullPath, routePath));
      }
    }
  }

  return routes;
}

/**
 * Discover routes from Next.js pages directory structure
 */
function discoverNextJsPagesRoutes(pagesDir, basePath = '') {
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

      routes.push({
        url: `${PERFORMANCE_CONFIG.baseUrl}${routePath}`,
        name: fileName === 'index' ? 'home' : fileName,
        path: routePath,
      });
    } else if (entry.isDirectory() && !entry.name.startsWith('_') && entry.name !== 'api') {
      const subPath = `${basePath}/${entry.name}`;
      routes.push(...discoverNextJsPagesRoutes(path.join(pagesDir, entry.name), subPath));
    }
  }

  return routes;
}

/**
 * Check if server is running
 */
async function checkServerAvailability() {
  try {
    const response = await fetch(PERFORMANCE_CONFIG.baseUrl);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Start development server if not running
 */
async function ensureServerRunning() {
  console.log('🔍 Checking if server is running...');

  const isRunning = await checkServerAvailability();

  if (isRunning) {
    console.log('✅ Server is already running');
    return null;
  }

  console.log('🚀 Starting development server...');

  const serverProcess = spawn('pnpm', ['dev'], {
    stdio: 'pipe',
    detached: false,
  });

  // Wait for server to start
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isReady = await checkServerAvailability();
    if (isReady) {
      console.log('✅ Server started successfully');
      return serverProcess;
    }

    attempts++;
    console.log(`⏳ Waiting for server... (${attempts}/${maxAttempts})`);
  }

  throw new Error('Failed to start server within timeout period');
}

/**
 * Run Lighthouse performance tests
 */
function runLighthouseTests(routes) {
  console.log('\n🔍 Running Lighthouse performance tests...');

  const results = [];

  for (const route of routes) {
    try {
      console.log(`   📊 Testing ${route.name} (${route.url})`);

      const lighthouseCommand = [
        'npx',
        'lighthouse',
        route.url,
        '--only-categories=performance',
        '--output=json',
        '--chrome-flags="--headless --no-sandbox"',
        '--quiet',
      ].join(' ');

      const output = execSync(lighthouseCommand, {
        encoding: 'utf8',
        timeout: 60000,
        stdio: 'pipe',
      });

      const lighthouseResults = JSON.parse(output);
      const performanceCategory = lighthouseResults.categories?.performance;
      const audits = lighthouseResults.audits || {};

      const result = {
        url: route.url,
        name: route.name,
        path: route.path,
        status: 'completed',
        score: Math.round((performanceCategory?.score || 0) * 100),
        metrics: {
          firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
          largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
          firstInputDelay: audits['max-potential-fid']?.numericValue || 0,
          cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
          speedIndex: audits['speed-index']?.numericValue || 0,
          timeToInteractive: audits['interactive']?.numericValue || 0,
          totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
        },
        budgetStatus: {},
      };

      // Check against performance budgets
      result.budgetStatus = {
        firstContentfulPaint:
          result.metrics.firstContentfulPaint <= PERFORMANCE_CONFIG.budgets.firstContentfulPaint,
        largestContentfulPaint:
          result.metrics.largestContentfulPaint <=
          PERFORMANCE_CONFIG.budgets.largestContentfulPaint,
        firstInputDelay:
          result.metrics.firstInputDelay <= PERFORMANCE_CONFIG.budgets.firstInputDelay,
        cumulativeLayoutShift:
          result.metrics.cumulativeLayoutShift <= PERFORMANCE_CONFIG.budgets.cumulativeLayoutShift,
        speedIndex: result.metrics.speedIndex <= PERFORMANCE_CONFIG.budgets.speedIndex,
        timeToInteractive:
          result.metrics.timeToInteractive <= PERFORMANCE_CONFIG.budgets.timeToInteractive,
      };

      results.push(result);

      console.log(`      ✅ Score: ${result.score}/100`);
      console.log(`      📈 LCP: ${Math.round(result.metrics.largestContentfulPaint)}ms`);
      console.log(`      ⚡ FCP: ${Math.round(result.metrics.firstContentfulPaint)}ms`);
    } catch (error) {
      console.log(`      ❌ Failed: ${error.message}`);
      results.push({
        url: route.url,
        name: route.name,
        path: route.path,
        status: 'failed',
        error: error.message,
        score: 0,
        metrics: {},
        budgetStatus: {},
      });
    }
  }

  return results;
}

/**
 * Generate performance report
 */
function generatePerformanceReport(lighthouseResults, routes) {
  const timestamp = new Date().toISOString();

  // Calculate overall metrics
  const completedTests = lighthouseResults.filter((r) => r.status === 'completed');
  const averageScore =
    completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, r) => sum + r.score, 0) / completedTests.length)
      : 0;

  // Check budget compliance
  const budgetViolations = [];
  completedTests.forEach((result) => {
    Object.entries(result.budgetStatus).forEach(([metric, passed]) => {
      if (!passed) {
        budgetViolations.push({
          route: result.name,
          metric,
          actual: result.metrics[metric],
          budget: PERFORMANCE_CONFIG.budgets[metric],
        });
      }
    });
  });

  const report = {
    timestamp,
    summary: {
      totalRoutes: routes.length,
      testedRoutes: lighthouseResults.length,
      completedTests: completedTests.length,
      failedTests: lighthouseResults.filter((r) => r.status === 'failed').length,
      averageScore,
      budgetViolations: budgetViolations.length,
    },
    compliance: {
      coreWebVitals:
        budgetViolations.filter((v) =>
          ['largestContentfulPaint', 'firstInputDelay', 'cumulativeLayoutShift'].includes(v.metric)
        ).length === 0,
      performanceBudget: budgetViolations.length === 0,
      industryStandards: averageScore >= 80,
    },
    results: lighthouseResults,
    budgetViolations,
    recommendations: generateRecommendations(budgetViolations, averageScore),
  };

  // Save report
  const reportsDir = path.join(process.cwd(), 'performance-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, `performance-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n📊 Performance report saved: ${reportPath}`);

  return report;
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(budgetViolations, averageScore) {
  const recommendations = [];

  if (averageScore < 80) {
    recommendations.push({
      priority: 'high',
      category: 'overall',
      issue: 'Low overall performance score',
      recommendation: 'Focus on Core Web Vitals optimization and bundle size reduction',
    });
  }

  budgetViolations.forEach((violation) => {
    switch (violation.metric) {
      case 'largestContentfulPaint':
        recommendations.push({
          priority: 'high',
          category: 'loading',
          issue: 'Largest Contentful Paint exceeds budget',
          recommendation:
            'Optimize images, reduce server response time, eliminate render-blocking resources',
        });
        break;
      case 'firstContentfulPaint':
        recommendations.push({
          priority: 'medium',
          category: 'loading',
          issue: 'First Contentful Paint exceeds budget',
          recommendation: 'Reduce server response time, eliminate render-blocking resources',
        });
        break;
      case 'cumulativeLayoutShift':
        recommendations.push({
          priority: 'high',
          category: 'stability',
          issue: 'Cumulative Layout Shift exceeds budget',
          recommendation:
            'Add size attributes to images and videos, avoid inserting content above existing content',
        });
        break;
    }
  });

  return recommendations;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 WellFlow Performance Testing Suite');
  console.log('=====================================');
  console.log(`🎯 Target: ${PERFORMANCE_CONFIG.baseUrl}`);
  console.log('📊 Report Directory: performance-reports\n');

  let serverProcess = null;

  try {
    // Ensure server is running
    serverProcess = await ensureServerRunning();

    // Discover routes
    const routes = discoverRoutes();

    if (routes.length === 0) {
      throw new Error('No routes discovered for testing');
    }

    // Run performance tests
    const lighthouseResults = runLighthouseTests(routes);

    // Generate comprehensive report
    const report = generatePerformanceReport(lighthouseResults, routes);

    console.log('\n📊 Final Results:');
    console.log(`   🎯 Overall Score: ${report.summary.averageScore}/100`);
    console.log(
      `   📈 Core Web Vitals: ${report.compliance.coreWebVitals ? '✅ PASSED' : '❌ FAILED'}`
    );
    console.log(
      `   💰 Performance Budget: ${report.compliance.performanceBudget ? '✅ WITHIN BUDGET' : '❌ OVER BUDGET'}`
    );
    console.log(
      `   🏭 Industry Standards: ${report.compliance.industryStandards ? '✅ MEETS REQUIREMENTS' : '❌ NEEDS IMPROVEMENT'}`
    );

    if (report.budgetViolations.length > 0) {
      console.log(`\n⚠️ Budget Violations: ${report.budgetViolations.length}`);
      report.budgetViolations.forEach((violation) => {
        console.log(
          `   - ${violation.route}: ${violation.metric} (${Math.round(violation.actual)}ms > ${violation.budget}ms)`
        );
      });
    }

    console.log('\n🎉 Performance testing completed!');
    console.log(`📋 Detailed report: performance-reports/performance-report-${Date.now()}.json`);

    // Exit with error code if performance budget exceeded
    if (!report.compliance.performanceBudget || !report.compliance.coreWebVitals) {
      console.log('\n❌ Performance requirements not met - review and optimize');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Performance testing failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up server process if we started it
    if (serverProcess) {
      console.log('🛑 Stopping development server...');
      serverProcess.kill();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  discoverRoutes,
  runLighthouseTests,
  generatePerformanceReport,
  PERFORMANCE_CONFIG,
};
