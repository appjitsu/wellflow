#!/usr/bin/env node

/**
 * WellFlow Performance Budget Checker
 * Validates performance metrics against defined budgets
 * for oil & gas production monitoring platform
 */

const fs = require('fs');
const path = require('path');

// Load performance budget configuration
function loadPerformanceBudget() {
  const budgetPath = path.join(process.cwd(), 'performance-budget.json');

  if (!fs.existsSync(budgetPath)) {
    console.error('❌ Performance budget configuration not found: performance-budget.json');
    process.exit(1);
  }

  try {
    const budgetContent = fs.readFileSync(budgetPath, 'utf8');
    return JSON.parse(budgetContent);
  } catch (error) {
    console.error('❌ Error loading performance budget configuration:', error.message);
    process.exit(1);
  }
}

// Load performance analysis results
function loadPerformanceAnalysis() {
  const analysisPath = path.join(process.cwd(), 'performance-reports/performance-analysis.json');

  if (!fs.existsSync(analysisPath)) {
    console.warn('⚠️  Performance analysis results not found. Run performance analysis first.');
    return null;
  }

  try {
    const analysisContent = fs.readFileSync(analysisPath, 'utf8');
    return JSON.parse(analysisContent);
  } catch (error) {
    console.error('❌ Error loading performance analysis results:', error.message);
    return null;
  }
}

// Check bundle size budgets
function checkBundleBudgets(analysis, budget) {
  console.log('📦 Checking bundle size budgets...');

  if (!analysis || !analysis.bundles) {
    console.warn('⚠️  Bundle analysis not available');
    return { passed: true, violations: [] };
  }

  const violations = [];
  const webBudgets = budget.budgets.web_application.targets;
  const bundles = analysis.bundles;

  // Check JavaScript budget
  if (bundles.javascript.sizeKB > webBudgets.javascript.budget_kb) {
    violations.push({
      type: 'bundle_size',
      asset: 'JavaScript',
      actual: bundles.javascript.sizeKB,
      budget: webBudgets.javascript.budget_kb,
      percentage: bundles.javascript.percentage,
      severity: 'error',
    });
  }

  // Check CSS budget
  if (bundles.css.sizeKB > webBudgets.css.budget_kb) {
    violations.push({
      type: 'bundle_size',
      asset: 'CSS',
      actual: bundles.css.sizeKB,
      budget: webBudgets.css.budget_kb,
      percentage: bundles.css.percentage,
      severity: 'error',
    });
  }

  // Check total budget
  if (bundles.total.sizeKB > webBudgets.total_initial_load.budget_kb) {
    violations.push({
      type: 'bundle_size',
      asset: 'Total',
      actual: bundles.total.sizeKB,
      budget: webBudgets.total_initial_load.budget_kb,
      percentage: bundles.total.percentage,
      severity: 'error',
    });
  }

  // Check warning thresholds
  const warningThreshold = budget.budgets.web_application.thresholds.warning_percentage;

  if (bundles.javascript.percentage >= warningThreshold && bundles.javascript.percentage < 100) {
    violations.push({
      type: 'bundle_size',
      asset: 'JavaScript',
      actual: bundles.javascript.sizeKB,
      budget: webBudgets.javascript.budget_kb,
      percentage: bundles.javascript.percentage,
      severity: 'warning',
    });
  }

  if (bundles.css.percentage >= warningThreshold && bundles.css.percentage < 100) {
    violations.push({
      type: 'bundle_size',
      asset: 'CSS',
      actual: bundles.css.sizeKB,
      budget: webBudgets.css.budget_kb,
      percentage: bundles.css.percentage,
      severity: 'warning',
    });
  }

  if (bundles.total.percentage >= warningThreshold && bundles.total.percentage < 100) {
    violations.push({
      type: 'bundle_size',
      asset: 'Total',
      actual: bundles.total.sizeKB,
      budget: webBudgets.total_initial_load.budget_kb,
      percentage: bundles.total.percentage,
      severity: 'warning',
    });
  }

  const passed = violations.filter((v) => v.severity === 'error').length === 0;

  console.log(`📊 Bundle Budget Check: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (violations.length > 0) {
    violations.forEach((violation) => {
      const icon = violation.severity === 'error' ? '❌' : '⚠️';
      console.log(
        `  ${icon} ${violation.asset}: ${violation.actual}KB / ${violation.budget}KB (${violation.percentage}%)`
      );
    });
  }

  return { passed, violations };
}

// Check API performance budgets
function checkAPIBudgets(analysis, budget) {
  console.log('🚀 Checking API performance budgets...');

  if (!analysis || !analysis.api) {
    console.warn('⚠️  API analysis not available');
    return { passed: true, violations: [] };
  }

  const violations = [];
  const apiBudgets = budget.budgets.api_application.targets.response_time_ms;
  const apiEndpoints = analysis.api.endpoints;

  // Check each endpoint
  Object.entries(apiEndpoints).forEach(([endpoint, data]) => {
    const budgetKey =
      endpoint === 'health'
        ? 'health_check'
        : endpoint === 'wells'
          ? 'wells_list'
          : endpoint === 'production'
            ? 'production_data'
            : null;

    if (budgetKey && apiBudgets[budgetKey]) {
      if (data.responseTimeMs > apiBudgets[budgetKey]) {
        violations.push({
          type: 'api_performance',
          endpoint,
          actual: data.responseTimeMs,
          budget: apiBudgets[budgetKey],
          severity: 'error',
        });
      }
    }
  });

  const passed = violations.length === 0;

  console.log(`📊 API Budget Check: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (violations.length > 0) {
    violations.forEach((violation) => {
      console.log(`  ❌ ${violation.endpoint}: ${violation.actual}ms / ${violation.budget}ms`);
    });
  }

  return { passed, violations };
}

// Check Core Web Vitals budgets
function checkCoreWebVitalsBudgets(analysis, budget) {
  console.log('📊 Checking Core Web Vitals budgets...');

  if (!analysis || !analysis.coreWebVitals) {
    console.warn('⚠️  Core Web Vitals analysis not available');
    return { passed: true, violations: [] };
  }

  const violations = [];
  const vitalsBudgets = budget.budgets.core_web_vitals.targets;
  const vitals = analysis.coreWebVitals;

  // Check Largest Contentful Paint
  if (vitals.largestContentfulPaint.valueMs > vitalsBudgets.largest_contentful_paint_ms.good) {
    violations.push({
      type: 'core_web_vitals',
      metric: 'Largest Contentful Paint',
      actual: vitals.largestContentfulPaint.valueMs,
      budget: vitalsBudgets.largest_contentful_paint_ms.good,
      severity:
        vitals.largestContentfulPaint.valueMs >
        vitalsBudgets.largest_contentful_paint_ms.needs_improvement
          ? 'error'
          : 'warning',
    });
  }

  // Check First Input Delay
  if (vitals.firstInputDelay.valueMs > vitalsBudgets.first_input_delay_ms.good) {
    violations.push({
      type: 'core_web_vitals',
      metric: 'First Input Delay',
      actual: vitals.firstInputDelay.valueMs,
      budget: vitalsBudgets.first_input_delay_ms.good,
      severity:
        vitals.firstInputDelay.valueMs > vitalsBudgets.first_input_delay_ms.needs_improvement
          ? 'error'
          : 'warning',
    });
  }

  // Check Cumulative Layout Shift
  if (vitals.cumulativeLayoutShift.value > vitalsBudgets.cumulative_layout_shift.good) {
    violations.push({
      type: 'core_web_vitals',
      metric: 'Cumulative Layout Shift',
      actual: vitals.cumulativeLayoutShift.value,
      budget: vitalsBudgets.cumulative_layout_shift.good,
      severity:
        vitals.cumulativeLayoutShift.value > vitalsBudgets.cumulative_layout_shift.needs_improvement
          ? 'error'
          : 'warning',
    });
  }

  const passed = violations.filter((v) => v.severity === 'error').length === 0;

  console.log(`📊 Core Web Vitals Check: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  if (violations.length > 0) {
    violations.forEach((violation) => {
      const icon = violation.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} ${violation.metric}: ${violation.actual} / ${violation.budget}`);
    });
  }

  return { passed, violations };
}

// Generate budget compliance report
function generateBudgetReport(bundleCheck, apiCheck, vitalsCheck, budget) {
  console.log('📋 Generating budget compliance report...');

  const timestamp = new Date().toISOString();
  const allViolations = [
    ...bundleCheck.violations,
    ...apiCheck.violations,
    ...vitalsCheck.violations,
  ];

  const overallPassed = bundleCheck.passed && apiCheck.passed && vitalsCheck.passed;
  const errorCount = allViolations.filter((v) => v.severity === 'error').length;
  const warningCount = allViolations.filter((v) => v.severity === 'warning').length;

  const report = {
    timestamp,
    repository: process.env.GITHUB_REPOSITORY || 'wellflow',
    branch: process.env.GITHUB_REF_NAME || 'local',
    commit: process.env.GITHUB_SHA || 'local',
    overall: {
      passed: overallPassed,
      errorCount,
      warningCount,
      totalViolations: allViolations.length,
    },
    checks: {
      bundleSizes: bundleCheck,
      apiPerformance: apiCheck,
      coreWebVitals: vitalsCheck,
    },
    violations: allViolations,
    recommendations: generateRecommendations(allViolations),
    compliance: {
      industryStandards: budget.compliance.standards,
      oilGasRequirements: budget.industry_requirements.oil_and_gas,
    },
  };

  // Ensure performance-reports directory exists
  const reportsDir = path.join(process.cwd(), 'performance-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Write budget compliance report
  const reportPath = path.join(reportsDir, 'budget-compliance.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✅ Budget compliance report generated: ${reportPath}`);

  return report;
}

// Generate recommendations based on violations
function generateRecommendations(violations) {
  const recommendations = [];

  const bundleViolations = violations.filter((v) => v.type === 'bundle_size');
  const apiViolations = violations.filter((v) => v.type === 'api_performance');
  const vitalsViolations = violations.filter((v) => v.type === 'core_web_vitals');

  if (bundleViolations.length > 0) {
    recommendations.push({
      category: 'Bundle Optimization',
      priority: 'high',
      actions: [
        'Implement code splitting for large JavaScript bundles',
        'Enable tree shaking to remove unused code',
        'Optimize images and compress assets',
        'Consider lazy loading for non-critical components',
        'Review and remove unused dependencies',
      ],
    });
  }

  if (apiViolations.length > 0) {
    recommendations.push({
      category: 'API Performance',
      priority: 'high',
      actions: [
        'Optimize database queries and add indexes',
        'Implement caching for frequently accessed data',
        'Consider API response compression',
        'Review and optimize business logic',
        'Add connection pooling for database connections',
      ],
    });
  }

  if (vitalsViolations.length > 0) {
    recommendations.push({
      category: 'Core Web Vitals',
      priority: 'medium',
      actions: [
        'Optimize largest content elements (images, text)',
        'Minimize JavaScript execution time',
        'Avoid layout shifts during page load',
        'Preload critical resources',
        'Optimize font loading strategies',
      ],
    });
  }

  return recommendations;
}

// Main execution function
function main() {
  console.log('🎯 Starting WellFlow Performance Budget Check...\n');

  try {
    // Load configuration and analysis results
    const budget = loadPerformanceBudget();
    const analysis = loadPerformanceAnalysis();

    if (!analysis) {
      console.log('⚠️  No performance analysis available. Budget check skipped.');
      return;
    }

    // Check budgets
    const bundleCheck = checkBundleBudgets(analysis, budget);
    const apiCheck = checkAPIBudgets(analysis, budget);
    const vitalsCheck = checkCoreWebVitalsBudgets(analysis, budget);

    // Generate compliance report
    const report = generateBudgetReport(bundleCheck, apiCheck, vitalsCheck, budget);

    console.log('\n📊 Performance Budget Summary:');
    console.log(`  Overall Status: ${report.overall.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Errors: ${report.overall.errorCount}`);
    console.log(`  Warnings: ${report.overall.warningCount}`);

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec) => {
        console.log(`  ${rec.category} (${rec.priority} priority):`);
        rec.actions.forEach((action) => {
          console.log(`    - ${action}`);
        });
      });
    }

    console.log('\n✅ Performance budget check completed!');

    // Exit with error code if budget violations found
    if (!report.overall.passed) {
      console.log('❌ Performance budget violations detected - review and optimize');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Performance budget check failed:', error.message);
    process.exit(1);
  }
}

// Run the check if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  loadPerformanceBudget,
  loadPerformanceAnalysis,
  checkBundleBudgets,
  checkAPIBudgets,
  checkCoreWebVitalsBudgets,
  generateBudgetReport,
};
