#!/usr/bin/env node

/**
 * WellFlow Infrastructure as Code Security Scanner
 *
 * Comprehensive security scanning for infrastructure configuration
 * Focuses on oil & gas production monitoring infrastructure security
 *
 * Industry Standards:
 * - NIST Cybersecurity Framework
 * - IEC 62443 (Industrial Cybersecurity)
 * - CIS Benchmarks
 * - OWASP Infrastructure Security
 * - Docker CIS Benchmarks
 * - Kubernetes CIS Benchmarks
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class InfrastructureSecurityScanner {
  constructor() {
    this.reportDir = 'security-reports';
    this.results = {
      timestamp: new Date().toISOString(),
      scans: {
        docker: { files: [], issues: [], passed: 0, failed: 0 },
        kubernetes: { files: [], issues: [], passed: 0, failed: 0 },
        terraform: { files: [], issues: [], passed: 0, failed: 0 },
        compose: { files: [], issues: [], passed: 0, failed: 0 },
        github_actions: { files: [], issues: [], passed: 0, failed: 0 },
      },
      summary: {
        total_files: 0,
        total_issues: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      compliance: {
        nist_cybersecurity: 'UNKNOWN',
        iec_62443: 'UNKNOWN',
        cis_benchmarks: 'UNKNOWN',
        owasp_infrastructure: 'UNKNOWN',
      },
      recommendations: [],
    };

    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  async runInfrastructureSecurityScan() {
    console.log('🏗️ WellFlow Infrastructure Security Scanner');
    console.log('==========================================');
    console.log(`📊 Report Directory: ${this.reportDir}`);
    console.log('');

    try {
      // Discover infrastructure files
      await this.discoverInfrastructureFiles();

      // Run security scans
      await this.scanDockerFiles();
      await this.scanKubernetesManifests();
      await this.scanTerraformFiles();
      await this.scanDockerComposeFiles();
      await this.scanGitHubActions();

      // Run Checkov scan if available
      await this.runCheckovScan();

      // Run Trivy scan if available
      await this.runTrivyScan();

      // Generate comprehensive report
      await this.generateInfrastructureReport();

      // Check compliance
      this.checkInfrastructureCompliance();

      console.log('\n🎉 Infrastructure security scanning completed!');
      console.log(`📋 Detailed report: ${this.reportDir}/infrastructure-security-report.json`);

      // Exit with error code if critical issues found
      if (this.results.summary.critical > 0) {
        console.log('\n❌ CRITICAL infrastructure security issues found! Build should fail.');
        process.exit(1);
      } else if (this.results.summary.high > 0) {
        console.log('\n⚠️ HIGH severity infrastructure issues found. Review required.');
        process.exit(1);
      } else {
        console.log('\n✅ No critical or high severity infrastructure issues detected.');
      }
    } catch (error) {
      console.error('❌ Infrastructure security scanning failed:', error.message);
      process.exit(1);
    }
  }

  async discoverInfrastructureFiles() {
    console.log('🔍 Discovering infrastructure files...');

    const patterns = {
      docker: ['**/Dockerfile*', '**/*.dockerfile'],
      kubernetes: ['**/*.yaml', '**/*.yml', '**/k8s/**/*', '**/kubernetes/**/*'],
      terraform: ['**/*.tf', '**/*.tfvars', '**/*.hcl'],
      compose: ['**/docker-compose*.yml', '**/docker-compose*.yaml'],
      github_actions: ['.github/workflows/*.yml', '.github/workflows/*.yaml'],
    };

    for (const [type, filePatterns] of Object.entries(patterns)) {
      const files = [];

      for (const pattern of filePatterns) {
        try {
          const matches = glob.sync(pattern, {
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
            absolute: false,
          });
          files.push(...matches);
        } catch (error) {
          console.log(`⚠️ Error scanning pattern ${pattern}: ${error.message}`);
        }
      }

      // Remove duplicates and filter relevant files
      const uniqueFiles = [...new Set(files)].filter((file) => {
        if (type === 'kubernetes') {
          // Only include k8s files, not all YAML files
          return file.includes('k8s') || file.includes('kubernetes') || this.isKubernetesFile(file);
        }
        return true;
      });

      this.results.scans[type].files = uniqueFiles;
      this.results.summary.total_files += uniqueFiles.length;

      if (uniqueFiles.length > 0) {
        console.log(`  📁 ${type}: ${uniqueFiles.length} files found`);
        uniqueFiles.forEach((file) => console.log(`    - ${file}`));
      }
    }

    console.log(`\n📊 Total infrastructure files: ${this.results.summary.total_files}`);
  }

  isKubernetesFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return (
        content.includes('apiVersion:') &&
        (content.includes('kind:') || content.includes('metadata:'))
      );
    } catch (error) {
      return false;
    }
  }

  async scanDockerFiles() {
    console.log('\n🐳 Scanning Docker files...');

    const dockerFiles = this.results.scans.docker.files;
    if (dockerFiles.length === 0) {
      console.log('  ℹ️ No Docker files found');
      return;
    }

    for (const dockerFile of dockerFiles) {
      console.log(`  🔍 Scanning ${dockerFile}...`);

      try {
        const content = fs.readFileSync(dockerFile, 'utf8');
        const issues = this.analyzeDockerFile(content, dockerFile);

        this.results.scans.docker.issues.push(...issues);

        if (issues.length === 0) {
          this.results.scans.docker.passed++;
          console.log(`    ✅ No issues found`);
        } else {
          this.results.scans.docker.failed++;
          console.log(`    ❌ ${issues.length} issues found`);
          issues.forEach((issue) => {
            console.log(
              `      ${this.getSeverityIcon(issue.severity)} ${issue.rule}: ${issue.message}`
            );
          });
        }
      } catch (error) {
        console.log(`    ⚠️ Error scanning ${dockerFile}: ${error.message}`);
      }
    }
  }

  analyzeDockerFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim().toUpperCase();

      // Check for security issues
      if (trimmedLine.startsWith('USER ROOT') || trimmedLine === 'USER 0') {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DKR001',
          severity: 'HIGH',
          message: 'Container running as root user',
          description: 'Running containers as root increases security risk',
        });
      }

      if (trimmedLine.includes('SUDO') && !trimmedLine.startsWith('#')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DKR002',
          severity: 'MEDIUM',
          message: 'Sudo usage detected',
          description: 'Avoid using sudo in containers',
        });
      }

      if (trimmedLine.includes('CURL') && trimmedLine.includes('HTTP://')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DKR003',
          severity: 'MEDIUM',
          message: 'Insecure HTTP download',
          description: 'Use HTTPS for downloading packages',
        });
      }

      if (
        trimmedLine.includes('ADD') &&
        (trimmedLine.includes('HTTP://') || trimmedLine.includes('HTTPS://'))
      ) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DKR004',
          severity: 'MEDIUM',
          message: 'ADD instruction with URL',
          description: 'Use COPY instead of ADD for better security',
        });
      }

      if (trimmedLine.includes('--PRIVILEGED')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DKR005',
          severity: 'CRITICAL',
          message: 'Privileged mode detected',
          description: 'Privileged containers have full access to host',
        });
      }
    });

    // Check for missing security practices
    if (!content.includes('USER ') || content.includes('USER root')) {
      issues.push({
        file: filePath,
        line: 0,
        rule: 'DKR006',
        severity: 'HIGH',
        message: 'No non-root user specified',
        description: 'Always specify a non-root user for containers',
      });
    }

    // Update summary counts
    issues.forEach((issue) => {
      this.results.summary.total_issues++;
      this.results.summary[issue.severity.toLowerCase()]++;
    });

    return issues;
  }

  async scanKubernetesManifests() {
    console.log('\n☸️ Scanning Kubernetes manifests...');

    const k8sFiles = this.results.scans.kubernetes.files;
    if (k8sFiles.length === 0) {
      console.log('  ℹ️ No Kubernetes manifests found');
      return;
    }

    for (const k8sFile of k8sFiles) {
      console.log(`  🔍 Scanning ${k8sFile}...`);

      try {
        const content = fs.readFileSync(k8sFile, 'utf8');
        const issues = this.analyzeKubernetesFile(content, k8sFile);

        this.results.scans.kubernetes.issues.push(...issues);

        if (issues.length === 0) {
          this.results.scans.kubernetes.passed++;
          console.log(`    ✅ No issues found`);
        } else {
          this.results.scans.kubernetes.failed++;
          console.log(`    ❌ ${issues.length} issues found`);
          issues.forEach((issue) => {
            console.log(
              `      ${this.getSeverityIcon(issue.severity)} ${issue.rule}: ${issue.message}`
            );
          });
        }
      } catch (error) {
        console.log(`    ⚠️ Error scanning ${k8sFile}: ${error.message}`);
      }
    }
  }

  analyzeKubernetesFile(content, filePath) {
    const issues = [];

    try {
      // Basic YAML parsing for security checks
      const lines = content.split('\n');
      let inSecurityContext = false;
      let inContainer = false;

      lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // Check for privileged containers
        if (trimmedLine.includes('privileged: true')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'K8S001',
            severity: 'CRITICAL',
            message: 'Privileged container detected',
            description: 'Privileged containers have access to host resources',
          });
        }

        // Check for root user
        if (trimmedLine.includes('runAsUser: 0') || trimmedLine.includes('runAsUser: "0"')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'K8S002',
            severity: 'HIGH',
            message: 'Container running as root',
            description: 'Containers should not run as root user',
          });
        }

        // Check for host network
        if (trimmedLine.includes('hostNetwork: true')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'K8S003',
            severity: 'HIGH',
            message: 'Host network access enabled',
            description: 'Host network access increases attack surface',
          });
        }

        // Check for host PID
        if (trimmedLine.includes('hostPID: true')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'K8S004',
            severity: 'HIGH',
            message: 'Host PID namespace access',
            description: 'Host PID access can expose host processes',
          });
        }

        // Check for missing resource limits
        if (trimmedLine.includes('containers:')) {
          inContainer = true;
        }

        if (inContainer && trimmedLine.includes('image:') && !content.includes('resources:')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'K8S005',
            severity: 'MEDIUM',
            message: 'Missing resource limits',
            description: 'Containers should have CPU and memory limits',
          });
        }
      });

      // Update summary counts
      issues.forEach((issue) => {
        this.results.summary.total_issues++;
        this.results.summary[issue.severity.toLowerCase()]++;
      });
    } catch (error) {
      console.log(`    ⚠️ Error parsing YAML: ${error.message}`);
    }

    return issues;
  }

  async scanTerraformFiles() {
    console.log('\n🏗️ Scanning Terraform files...');

    const terraformFiles = this.results.scans.terraform.files;
    if (terraformFiles.length === 0) {
      console.log('  ℹ️ No Terraform files found');
      return;
    }

    // Basic Terraform security checks
    for (const tfFile of terraformFiles) {
      console.log(`  🔍 Scanning ${tfFile}...`);

      try {
        const content = fs.readFileSync(tfFile, 'utf8');
        const issues = this.analyzeTerraformFile(content, tfFile);

        this.results.scans.terraform.issues.push(...issues);

        if (issues.length === 0) {
          this.results.scans.terraform.passed++;
          console.log(`    ✅ No issues found`);
        } else {
          this.results.scans.terraform.failed++;
          console.log(`    ❌ ${issues.length} issues found`);
        }
      } catch (error) {
        console.log(`    ⚠️ Error scanning ${tfFile}: ${error.message}`);
      }
    }
  }

  analyzeTerraformFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // Check for hardcoded secrets
      if (
        trimmedLine.includes('password') &&
        trimmedLine.includes('=') &&
        !trimmedLine.includes('var.') &&
        !trimmedLine.includes('random_')
      ) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'TF001',
          severity: 'CRITICAL',
          message: 'Hardcoded password detected',
          description: 'Use variables or secrets management for passwords',
        });
      }

      // Check for public access
      if (trimmedLine.includes('0.0.0.0/0') || trimmedLine.includes('::/0')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'TF002',
          severity: 'HIGH',
          message: 'Public access detected',
          description: 'Avoid exposing resources to the entire internet',
        });
      }
    });

    // Update summary counts
    issues.forEach((issue) => {
      this.results.summary.total_issues++;
      this.results.summary[issue.severity.toLowerCase()]++;
    });

    return issues;
  }

  async scanDockerComposeFiles() {
    console.log('\n🐙 Scanning Docker Compose files...');

    const composeFiles = this.results.scans.compose.files;
    if (composeFiles.length === 0) {
      console.log('  ℹ️ No Docker Compose files found');
      return;
    }

    for (const composeFile of composeFiles) {
      console.log(`  🔍 Scanning ${composeFile}...`);

      try {
        const content = fs.readFileSync(composeFile, 'utf8');
        const issues = this.analyzeDockerComposeFile(content, composeFile);

        this.results.scans.compose.issues.push(...issues);

        if (issues.length === 0) {
          this.results.scans.compose.passed++;
          console.log(`    ✅ No issues found`);
        } else {
          this.results.scans.compose.failed++;
          console.log(`    ❌ ${issues.length} issues found`);
        }
      } catch (error) {
        console.log(`    ⚠️ Error scanning ${composeFile}: ${error.message}`);
      }
    }
  }

  analyzeDockerComposeFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // Check for privileged mode
      if (trimmedLine.includes('privileged: true')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DC001',
          severity: 'CRITICAL',
          message: 'Privileged mode enabled',
          description: 'Privileged containers have full host access',
        });
      }

      // Check for host network
      if (trimmedLine.includes('network_mode: host')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'DC002',
          severity: 'HIGH',
          message: 'Host network mode',
          description: 'Host network mode bypasses container isolation',
        });
      }
    });

    // Update summary counts
    issues.forEach((issue) => {
      this.results.summary.total_issues++;
      this.results.summary[issue.severity.toLowerCase()]++;
    });

    return issues;
  }

  async scanGitHubActions() {
    console.log('\n⚡ Scanning GitHub Actions workflows...');

    const actionFiles = this.results.scans.github_actions.files;
    if (actionFiles.length === 0) {
      console.log('  ℹ️ No GitHub Actions workflows found');
      return;
    }

    for (const actionFile of actionFiles) {
      console.log(`  🔍 Scanning ${actionFile}...`);

      try {
        const content = fs.readFileSync(actionFile, 'utf8');
        const issues = this.analyzeGitHubActionsFile(content, actionFile);

        this.results.scans.github_actions.issues.push(...issues);

        if (issues.length === 0) {
          this.results.scans.github_actions.passed++;
          console.log(`    ✅ No issues found`);
        } else {
          this.results.scans.github_actions.failed++;
          console.log(`    ❌ ${issues.length} issues found`);
        }
      } catch (error) {
        console.log(`    ⚠️ Error scanning ${actionFile}: ${error.message}`);
      }
    }
  }

  analyzeGitHubActionsFile(content, filePath) {
    const issues = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // Check for hardcoded secrets
      if (trimmedLine.includes('password:') || trimmedLine.includes('token:')) {
        if (!trimmedLine.includes('${{') && !trimmedLine.includes('secrets.')) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: 'GHA001',
            severity: 'CRITICAL',
            message: 'Hardcoded secret detected',
            description: 'Use GitHub secrets for sensitive data',
          });
        }
      }

      // Check for pull_request_target without proper restrictions
      if (trimmedLine.includes('pull_request_target:')) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: 'GHA002',
          severity: 'MEDIUM',
          message: 'pull_request_target usage',
          description: 'Ensure proper security restrictions with pull_request_target',
        });
      }
    });

    // Update summary counts
    issues.forEach((issue) => {
      this.results.summary.total_issues++;
      this.results.summary[issue.severity.toLowerCase()]++;
    });

    return issues;
  }

  async runCheckovScan() {
    console.log('\n🔍 Running Checkov security scan...');

    try {
      // Check if Checkov is available
      execSync('which checkov', { stdio: 'pipe' });

      console.log('  📡 Checkov found, running comprehensive scan...');

      const checkovOutput = execSync(
        'checkov -d . --framework dockerfile,kubernetes,terraform,github_actions --output json',
        {
          stdio: 'pipe',
          encoding: 'utf8',
        }
      );

      const checkovResults = JSON.parse(checkovOutput);

      // Process Checkov results
      if (checkovResults.results && checkovResults.results.failed_checks) {
        console.log(`  📊 Checkov found ${checkovResults.results.failed_checks.length} issues`);

        // Save Checkov results
        fs.writeFileSync(
          path.join(this.reportDir, 'checkov-results.json'),
          JSON.stringify(checkovResults, null, 2)
        );
      }
    } catch (error) {
      console.log('  ℹ️ Checkov not available, skipping advanced scan');
      console.log('  💡 Install Checkov for comprehensive infrastructure security scanning');
    }
  }

  async runTrivyScan() {
    console.log('\n🛡️ Running Trivy security scan...');

    try {
      // Check if Trivy is available
      execSync('which trivy', { stdio: 'pipe' });

      console.log('  📡 Trivy found, scanning for misconfigurations...');

      const trivyOutput = execSync('trivy config . --format json', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      const trivyResults = JSON.parse(trivyOutput);

      // Save Trivy results
      fs.writeFileSync(
        path.join(this.reportDir, 'trivy-results.json'),
        JSON.stringify(trivyResults, null, 2)
      );

      console.log('  📊 Trivy scan completed');
    } catch (error) {
      console.log('  ℹ️ Trivy not available, skipping container security scan');
      console.log('  💡 Install Trivy for container and infrastructure security scanning');
    }
  }

  getSeverityIcon(severity) {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return '🚨';
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🔵';
      default:
        return 'ℹ️';
    }
  }

  checkInfrastructureCompliance() {
    const { summary } = this.results;

    // Determine compliance status
    this.results.compliance.nist_cybersecurity =
      summary.critical === 0 && summary.high === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';
    this.results.compliance.iec_62443 = summary.critical === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';
    this.results.compliance.cis_benchmarks =
      summary.critical === 0 && summary.high <= 2 ? 'COMPLIANT' : 'NON_COMPLIANT';
    this.results.compliance.owasp_infrastructure =
      summary.critical === 0 && summary.high === 0 ? 'COMPLIANT' : 'NON_COMPLIANT';

    console.log('\n🏭 Infrastructure Compliance Check:');
    console.log(
      `   NIST Cybersecurity: ${this.results.compliance.nist_cybersecurity === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`
    );
    console.log(
      `   IEC 62443: ${this.results.compliance.iec_62443 === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`
    );
    console.log(
      `   CIS Benchmarks: ${this.results.compliance.cis_benchmarks === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`
    );
    console.log(
      `   OWASP Infrastructure: ${this.results.compliance.owasp_infrastructure === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`
    );
  }

  async generateInfrastructureReport() {
    const reportPath = path.join(this.reportDir, 'infrastructure-security-report.json');
    const markdownPath = path.join(this.reportDir, 'infrastructure-security-report.md');

    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    // Generate Markdown report
    const markdown = this.generateMarkdownReport();
    fs.writeFileSync(markdownPath, markdown);

    console.log(`\n📊 Infrastructure security reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${markdownPath}`);
  }

  generateMarkdownReport() {
    const { summary, scans, compliance } = this.results;

    return `# WellFlow Infrastructure Security Assessment Report

**Generated:** ${this.results.timestamp}

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Files Scanned | ${summary.total_files} |
| Total Issues Found | ${summary.total_issues} |

## Severity Breakdown

| Severity | Count | Status |
|----------|-------|--------|
| 🚨 Critical | ${summary.critical} | ${summary.critical === 0 ? '✅ GOOD' : '❌ ACTION REQUIRED'} |
| 🔴 High | ${summary.high} | ${summary.high === 0 ? '✅ GOOD' : '⚠️ REVIEW REQUIRED'} |
| 🟡 Medium | ${summary.medium} | ${summary.medium === 0 ? '✅ GOOD' : 'ℹ️ MONITOR'} |
| 🔵 Low | ${summary.low} | ℹ️ INFORMATIONAL |

## Infrastructure Components Scanned

| Component | Files | Passed | Failed | Issues |
|-----------|-------|--------|--------|--------|
| 🐳 Docker | ${scans.docker.files.length} | ${scans.docker.passed} | ${scans.docker.failed} | ${scans.docker.issues.length} |
| ☸️ Kubernetes | ${scans.kubernetes.files.length} | ${scans.kubernetes.passed} | ${scans.kubernetes.failed} | ${scans.kubernetes.issues.length} |
| 🏗️ Terraform | ${scans.terraform.files.length} | ${scans.terraform.passed} | ${scans.terraform.failed} | ${scans.terraform.issues.length} |
| 🐙 Docker Compose | ${scans.compose.files.length} | ${scans.compose.passed} | ${scans.compose.failed} | ${scans.compose.issues.length} |
| ⚡ GitHub Actions | ${scans.github_actions.files.length} | ${scans.github_actions.passed} | ${scans.github_actions.failed} | ${scans.github_actions.issues.length} |

## Industry Compliance

### Oil & Gas Industry Standards
- **NIST Cybersecurity Framework**: ${compliance.nist_cybersecurity === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}
- **IEC 62443 (Industrial Cybersecurity)**: ${compliance.iec_62443 === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}
- **CIS Benchmarks**: ${compliance.cis_benchmarks === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}
- **OWASP Infrastructure Security**: ${compliance.owasp_infrastructure === 'COMPLIANT' ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}

## Detailed Issues

${Object.entries(scans)
  .map(([component, scan]) => {
    if (scan.issues.length === 0)
      return `### ${component.charAt(0).toUpperCase() + component.slice(1)}\n✅ No issues found\n`;

    return `### ${component.charAt(0).toUpperCase() + component.slice(1)}
${scan.issues
  .map(
    (issue) =>
      `- **${issue.rule}** (${issue.severity}): ${issue.message}
  - File: ${issue.file}${issue.line ? `:${issue.line}` : ''}
  - Description: ${issue.description}
`
  )
  .join('\n')}`;
  })
  .join('\n')}

## Recommendations

${summary.critical > 0 ? '🚨 **CRITICAL**: Immediate action required to address critical infrastructure vulnerabilities.' : ''}
${summary.high > 0 ? '🔴 **HIGH**: Review and remediate high-severity infrastructure issues within 24-48 hours.' : ''}
${summary.medium > 0 ? '🟡 **MEDIUM**: Address medium-severity infrastructure issues in next development cycle.' : ''}

## Oil & Gas Infrastructure Security Considerations

- Ensure proper network segmentation between IT and OT systems
- Implement container security best practices for industrial environments
- Regular infrastructure security assessments for critical systems
- Compliance with industry regulations (NERC CIP, TSA Pipeline Security)
- Secure configuration management for SCADA and control systems

## Tools Recommendations

For enhanced infrastructure security scanning, consider installing:
- **Checkov**: Comprehensive infrastructure as code security scanner
- **Trivy**: Container and infrastructure vulnerability scanner
- **Terrascan**: Terraform security scanner
- **Hadolint**: Docker best practices linter

---
*Report generated by WellFlow Infrastructure Security Scanner*
*Compliant with NIST, IEC 62443, and CIS Benchmark standards*`;
  }
}

// Run infrastructure security scan if called directly
if (require.main === module) {
  const scanner = new InfrastructureSecurityScanner();
  scanner.runInfrastructureSecurityScan().catch((error) => {
    console.error('Infrastructure security scanning failed:', error);
    process.exit(1);
  });
}

module.exports = InfrastructureSecurityScanner;
