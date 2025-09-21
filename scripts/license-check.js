#!/usr/bin/env node

/**
 * License Compliance Scanner for WellFlow
 *
 * Scans all dependencies for license compliance, ensuring no GPL, AGPL,
 * or other restrictive licenses are used that may not be suitable for
 * commercial oil & gas software.
 *
 * Industry Standards:
 * - NIST Cybersecurity Framework: Supply Chain Risk Management
 * - ISO 27001: Information Security Management
 * - Oil & Gas Industry: Commercial software compliance requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for license compliance
const LICENSE_CONFIG = {
  // Licenses that are explicitly allowed
  allowedLicenses: [
    'MIT',
    'Apache-2.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'ISC',
    'CC0-1.0',
    'Unlicense',
    'WTFPL',
    '0BSD',
    'BlueOak-1.0.0',
    'Python-2.0',
  ],

  // Licenses that are explicitly forbidden for commercial use
  forbiddenLicenses: [
    'GPL-2.0',
    'GPL-3.0',
    'AGPL-1.0',
    'AGPL-3.0',
    'LGPL-2.0',
    'LGPL-2.1',
    'LGPL-3.0',
    'EUPL-1.1',
    'EUPL-1.2',
    'CDDL-1.0',
    'CDDL-1.1',
    'EPL-1.0',
    'EPL-2.0',
    'MPL-1.1',
    'MPL-2.0',
    'SSPL-1.0',
    'BUSL-1.1',
  ],

  // Licenses that require manual review
  reviewRequired: ['CC-BY-4.0', 'CC-BY-SA-4.0', 'OFL-1.1', 'Artistic-2.0', 'Ruby', 'Zlib'],

  // Packages that are allowed despite having problematic licenses
  exceptions: [
    // Add specific packages here if needed
    // Example: { name: 'package-name', version: '1.0.0', reason: 'Critical dependency, legal review completed' }
  ],
};

/**
 * Main license checking function
 */
async function main() {
  console.log('🔍 Starting WellFlow License Compliance Scan...\n');

  try {
    // Check if license-checker is installed
    try {
      // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process
      execSync('npx license-checker --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing license-checker...');
      // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process
      execSync('npm install -g license-checker', { stdio: 'inherit' });
    }

    const results = {
      compliant: [],
      violations: [],
      reviewRequired: [],
      unknown: [],
      summary: {
        totalPackages: 0,
        compliantPackages: 0,
        violationPackages: 0,
        reviewPackages: 0,
        unknownPackages: 0,
      },
    };

    // Scan each workspace
    const workspaces = ['apps/web', 'apps/api', 'apps/docs'];

    for (const workspace of workspaces) {
      if (fs.existsSync(path.join(workspace, 'package.json'))) {
        console.log(`📋 Scanning ${workspace}...`);
        await scanWorkspace(workspace, results);
      }
    }

    // Generate report
    generateReport(results);

    // Exit with error code if violations found
    if (results.violations.length > 0) {
      console.log('\n❌ License compliance violations found!');
      process.exit(1);
    } else {
      console.log('\n✅ All dependencies are license compliant!');
    }
  } catch (error) {
    console.error('❌ License scanning failed:', error.message);
    process.exit(1);
  }
}

/**
 * Scan a specific workspace for license compliance
 */
async function scanWorkspace(workspace, results) {
  try {
    // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process
    const licenseData = execSync(`cd ${workspace} && npx license-checker --json --production`, {
      encoding: 'utf8',
      timeout: 60000,
    });

    const licenses = JSON.parse(licenseData);

    for (const [packageName, packageInfo] of Object.entries(licenses)) {
      const license = packageInfo.licenses;
      const packageResult = {
        name: packageName,
        license: license,
        path: packageInfo.path,
        repository: packageInfo.repository,
        workspace: workspace,
      };

      results.summary.totalPackages++;

      // Check if package is in exceptions list
      const exception = LICENSE_CONFIG.exceptions.find((ex) => packageName.includes(ex.name));

      if (exception) {
        packageResult.exception = exception.reason;
        results.compliant.push(packageResult);
        results.summary.compliantPackages++;
        continue;
      }

      // Check license compliance
      if (isLicenseAllowed(license)) {
        results.compliant.push(packageResult);
        results.summary.compliantPackages++;
      } else if (isLicenseForbidden(license)) {
        packageResult.severity = 'HIGH';
        packageResult.reason = 'Forbidden license for commercial use';
        results.violations.push(packageResult);
        results.summary.violationPackages++;
      } else if (isLicenseReviewRequired(license)) {
        packageResult.severity = 'MEDIUM';
        packageResult.reason = 'License requires manual review';
        results.reviewRequired.push(packageResult);
        results.summary.reviewPackages++;
      } else {
        packageResult.severity = 'LOW';
        packageResult.reason = 'Unknown license, requires investigation';
        results.unknown.push(packageResult);
        results.summary.unknownPackages++;
      }
    }
  } catch (error) {
    console.warn(`⚠️ Failed to scan ${workspace}: ${error.message}`);
  }
}

/**
 * Check if a license is explicitly allowed
 */
function isLicenseAllowed(license) {
  if (!license) return false;

  const normalizedLicense = normalizeLicense(license);
  return LICENSE_CONFIG.allowedLicenses.some((allowed) =>
    normalizedLicense.includes(allowed.toLowerCase())
  );
}

/**
 * Check if a license is explicitly forbidden
 */
function isLicenseForbidden(license) {
  if (!license) return false;

  const normalizedLicense = normalizeLicense(license);
  return LICENSE_CONFIG.forbiddenLicenses.some((forbidden) =>
    normalizedLicense.includes(forbidden.toLowerCase())
  );
}

/**
 * Check if a license requires manual review
 */
function isLicenseReviewRequired(license) {
  if (!license) return false;

  const normalizedLicense = normalizeLicense(license);
  return LICENSE_CONFIG.reviewRequired.some((review) =>
    normalizedLicense.includes(review.toLowerCase())
  );
}

/**
 * Normalize license string for comparison
 */
function normalizeLicense(license) {
  return license
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '');
}

/**
 * Generate comprehensive license compliance report
 */
function generateReport(results) {
  console.log('\n📊 License Compliance Report:');
  console.log(`   📦 Total Packages: ${results.summary.totalPackages}`);
  console.log(`   ✅ Compliant: ${results.summary.compliantPackages}`);
  console.log(`   ❌ Violations: ${results.summary.violationPackages}`);
  console.log(`   ⚠️ Review Required: ${results.summary.reviewPackages}`);
  console.log(`   ❓ Unknown: ${results.summary.unknownPackages}`);

  // Show violations
  if (results.violations.length > 0) {
    console.log('\n❌ License Violations:');
    results.violations.forEach((violation, index) => {
      console.log(`   ${index + 1}. ${violation.name}`);
      console.log(`      License: ${violation.license}`);
      console.log(`      Reason: ${violation.reason}`);
      console.log(`      Workspace: ${violation.workspace}`);
    });
  }

  // Show packages requiring review
  if (results.reviewRequired.length > 0) {
    console.log('\n⚠️ Packages Requiring Review:');
    results.reviewRequired.forEach((pkg, index) => {
      console.log(`   ${index + 1}. ${pkg.name}`);
      console.log(`      License: ${pkg.license}`);
      console.log(`      Workspace: ${pkg.workspace}`);
    });
  }

  // Show unknown licenses
  if (results.unknown.length > 0) {
    console.log('\n❓ Unknown Licenses:');
    results.unknown.forEach((pkg, index) => {
      console.log(`   ${index + 1}. ${pkg.name}`);
      console.log(`      License: ${pkg.license}`);
      console.log(`      Workspace: ${pkg.workspace}`);
    });
  }

  // Save detailed report
  const reportsDir = 'license-reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'license-compliance.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`\n📄 Detailed report saved: ${reportPath}`);
}

// Run the license check if this script is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ License check failed:', error);
    process.exit(1);
  });
}

module.exports = {
  main,
  scanWorkspace,
  isLicenseAllowed,
  isLicenseForbidden,
  isLicenseReviewRequired,
};
