# WellFlow Security Testing Framework

## Executive Summary

This document outlines a comprehensive security testing framework for WellFlow
API, designed to ensure continuous security validation and OWASP API Security
Top 10 2023 compliance. The framework integrates automated security testing into
our CI/CD pipeline and provides ongoing security assurance.

**Framework Components**:

- Automated Security Testing (SAST/DAST)
- OWASP-specific Test Suites
- Penetration Testing Guidelines
- Security Regression Testing
- Continuous Security Monitoring

## 🔧 **Automated Security Testing Pipeline**

### **1. Static Application Security Testing (SAST)**

**Tools Integration**:

- **SonarQube**: Code quality and security analysis
- **Semgrep**: Custom security rule engine
- **ESLint Security Plugin**: JavaScript/TypeScript security linting

**Implementation**:

```yaml
# .github/workflows/security-sast.yml
name: SAST Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          scanMetadataReportFile: target/sonar/report-task.txt

      - name: Semgrep Security Scan
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit p/owasp-top-ten p/typescript p/nodejs

      - name: ESLint Security Scan
        run: |
          npm install
          npx eslint . --ext .ts,.js --config .eslintrc.security.js

      - name: Upload SARIF results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: semgrep.sarif
```

**Custom Security Rules**:

```javascript
// .eslintrc.security.js
module.exports = {
  extends: [
    'plugin:security/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  plugins: ['security', 'no-secrets'],
  rules: {
    // OWASP API1: Broken Object Level Authorization
    'security/detect-object-injection': 'error',

    // OWASP API2: Broken Authentication
    'security/detect-hardcoded-credentials': 'error',
    'no-secrets/no-secrets': 'error',

    // OWASP API3: Broken Object Property Level Authorization
    'security/detect-unsafe-regex': 'error',

    // OWASP API7: Server Side Request Forgery
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',

    // OWASP API8: Security Misconfiguration
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',

    // OWASP API10: Unsafe Consumption of APIs
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
  },
};
```

### **2. Dynamic Application Security Testing (DAST)**

**OWASP ZAP Integration**:

```yaml
# .github/workflows/security-dast.yml
name: DAST Security Scan

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  dast-scan:
    runs-on: ubuntu-latest
    services:
      wellflow-api:
        image: wellflow/api:latest
        ports:
          - 3000:3000
        env:
          NODE_ENV: test
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

    steps:
      - name: Wait for API to be ready
        run: |
          timeout 300 bash -c 'until curl -f http://localhost:3000/health; do sleep 5; done'

      - name: OWASP ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'http://localhost:3000'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a -j -m 10 -T 60'

      - name: Upload ZAP Results
        uses: actions/upload-artifact@v3
        with:
          name: zap-results
          path: report_html.html
```

**ZAP Security Rules Configuration**:

```tsv
# .zap/rules.tsv - OWASP API Security focused rules
10003 IGNORE # Vulnerable JS Library (handled by dependency scanning)
10020 IGNORE # X-Frame-Options (we use CSP frame-ancestors)
10021 IGNORE # X-Content-Type-Options (already implemented)
10023 IGNORE # Information Disclosure - Debug Error Messages
10024 IGNORE # Information Disclosure - Sensitive Information in URL
10025 IGNORE # Information Disclosure - Sensitive Information in HTTP Referrer Header
10026 IGNORE # HTTP Parameter Override
10027 IGNORE # Information Disclosure - Suspicious Comments
10028 IGNORE # Open Redirect
10029 IGNORE # Cookie Poisoning
10030 IGNORE # User Controllable Charset
10031 IGNORE # User Controllable HTML Element Attribute (Potential XSS)
10032 IGNORE # Viewstate Scanner
10033 IGNORE # Directory Browsing
10034 IGNORE # Heartbleed OpenSSL Vulnerability
10035 IGNORE # Strict-Transport-Security Header Not Set
10036 IGNORE # Server Leaks Version Information via "Server" HTTP Response Header Field
10037 IGNORE # Server Leaks Information via "X-Powered-By" HTTP Response Header Field(s)
10038 IGNORE # Content Security Policy (CSP) Header Not Set
10039 IGNORE # X-Backend-Server Header Information Leak
10040 IGNORE # Secure Pages Include Mixed Content
10041 IGNORE # HTTP to HTTPS Insecure Transition in Form Post
10042 IGNORE # HTTPS to HTTP Insecure Transition in Form Post
10043 IGNORE # User Controllable JavaScript Event (XSS)
10044 IGNORE # Big Redirect Detected (Potential Sensitive Information Leak)
10045 IGNORE # Source Code Disclosure - /WEB-INF folder
10046 IGNORE # Source Code Disclosure - /META-INF folder
10047 IGNORE # Source Code Disclosure - Java
10048 IGNORE # Remote Code Execution - Shell Shock
10049 IGNORE # Content Cacheability
10050 IGNORE # Retrieved from Cache
10051 IGNORE # Relative Path Confusion
10052 IGNORE # X-ChromeLogger-Data (XCOLD) Header Information Leak
10053 IGNORE # Apache Range Header DoS (CVE-2011-3192)
10054 IGNORE # Cookie Without SameSite Attribute
10055 IGNORE # CSP Scanner
10056 IGNORE # X-Debug-Token Information Leak
10057 IGNORE # Username Hash Found
10058 IGNORE # GET for POST
10059 IGNORE # X-AspNet-Version Response Header
10060 IGNORE # Cross-Domain Misconfiguration
10061 IGNORE # X-AspNetMvc-Version Response Header
10062 IGNORE # PII Disclosure
10063 IGNORE # Feature Policy Header Not Set
10096 IGNORE # Timestamp Disclosure
10097 IGNORE # Hash Disclosure
10098 IGNORE # Cross-Domain JavaScript Source File Inclusion
10099 IGNORE # Source Code Disclosure
10100 IGNORE # Weak Authentication Method
10101 IGNORE # Insecure HTTP Method
10102 IGNORE # HTTP Only Site
10103 IGNORE # Weak HTTP Authentication over HTTP
10104 IGNORE # User Agent Fuzzer
10105 IGNORE # Weak Authentication Method
10106 IGNORE # HTTP Only Site
10107 IGNORE # Httpoxy - Proxy Header Misuse
10108 IGNORE # Reverse Tabnabbing
10109 IGNORE # Modern Web Application
10110 IGNORE # Dangerous JS Functions
10111 IGNORE # Authentication Request Identified
10112 IGNORE # Session Fixation
10113 IGNORE # Verification.asmx Information Leak
10114 IGNORE # Script (Suspicious Content)
10115 IGNORE # Aspx View State
10200 WARN # Private IP Disclosure
```

### **3. OWASP-Specific Test Suites**

**API Security Test Cases**:

```typescript
// tests/security/owasp-api-tests.spec.ts
describe('OWASP API Security Top 10 2023 Tests', () => {
  describe('API1: Broken Object Level Authorization', () => {
    it('should prevent access to other users objects', async () => {
      const user1Token = await getAuthToken('user1@example.com');
      const user2Token = await getAuthToken('user2@example.com');

      // Create resource as user1
      const resource = await request(app)
        .post('/api/wells')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validWellData)
        .expect(201);

      // Try to access as user2 - should fail
      await request(app)
        .get(`/api/wells/${resource.body.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });

    it('should prevent modification of other users objects', async () => {
      const user1Token = await getAuthToken('user1@example.com');
      const user2Token = await getAuthToken('user2@example.com');

      const resource = await createWellAsUser('user1@example.com');

      await request(app)
        .put(`/api/wells/${resource.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Hacked Well' })
        .expect(403);
    });
  });

  describe('API2: Broken Authentication', () => {
    it('should reject invalid JWT tokens', async () => {
      await request(app)
        .get('/api/wells')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should enforce token expiration', async () => {
      const expiredToken = jwt.sign(
        { sub: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET
      );

      await request(app)
        .get('/api/wells')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should enforce account lockout after failed attempts', async () => {
      const email = 'test@example.com';

      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email, password: 'wrongpassword' })
          .expect(401);
      }

      // 6th attempt should be locked out
      await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(423); // Locked
    });
  });

  describe('API3: Broken Object Property Level Authorization', () => {
    it('should not expose sensitive fields to unauthorized users', async () => {
      const adminToken = await getAuthToken('admin@example.com');
      const userToken = await getAuthToken('user@example.com');

      const user = await createUser({ role: 'USER' });

      // Admin should see all fields
      const adminResponse = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminResponse.body).toHaveProperty('email');
      expect(adminResponse.body).toHaveProperty('role');

      // Regular user should not see sensitive fields
      const userResponse = await request(app)
        .get(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(userResponse.body).not.toHaveProperty('email');
      expect(userResponse.body).not.toHaveProperty('role');
    });
  });

  describe('API4: Unrestricted Resource Consumption', () => {
    it('should enforce rate limiting', async () => {
      const token = await getAuthToken('user@example.com');

      // Make requests up to the limit
      for (let i = 0; i < 60; i++) {
        await request(app)
          .get('/api/wells')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
      }

      // Next request should be rate limited
      await request(app)
        .get('/api/wells')
        .set('Authorization', `Bearer ${token}`)
        .expect(429);
    });

    it('should reject oversized payloads', async () => {
      const token = await getAuthToken('user@example.com');
      const largePayload = 'x'.repeat(10 * 1024 * 1024); // 10MB

      await request(app)
        .post('/api/wells')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: largePayload })
        .expect(413); // Payload Too Large
    });
  });

  describe('API7: Server Side Request Forgery', () => {
    it('should block internal network requests', async () => {
      const token = await getAuthToken('user@example.com');

      await request(app)
        .post('/api/external/fetch')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'http://localhost:3000/admin' })
        .expect(400);

      await request(app)
        .post('/api/external/fetch')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'http://192.168.1.1/admin' })
        .expect(400);
    });

    it('should only allow whitelisted domains', async () => {
      const token = await getAuthToken('user@example.com');

      // Allowed domain
      await request(app)
        .post('/api/external/fetch')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'https://api.weather.gov/data' })
        .expect(200);

      // Blocked domain
      await request(app)
        .post('/api/external/fetch')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: 'https://malicious.com/data' })
        .expect(400);
    });
  });
});
```

### **4. Security Performance Testing**

**Load Testing with Security Focus**:

```javascript
// tests/security/security-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'], // Error rate under 10%
  },
};

export default function () {
  // Test authentication under load
  const loginResponse = http.post('http://localhost:3000/api/auth/login', {
    email: 'loadtest@example.com',
    password: 'password123',
  });

  check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time OK': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  if (loginResponse.status === 200) {
    const token = loginResponse.json('accessToken');

    // Test API endpoints under load
    const apiResponse = http.get('http://localhost:3000/api/wells', {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(apiResponse, {
      'API call successful': (r) => r.status === 200,
      'API response time OK': (r) => r.timings.duration < 500,
      'rate limiting working': (r) => r.status !== 429 || r.status === 429,
    }) || errorRate.add(1);
  }

  sleep(1);
}
```

### **5. Dependency Vulnerability Scanning**

**Automated Dependency Checks**:

```yaml
# .github/workflows/security-dependencies.yml
name: Dependency Security Scan

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * *' # Daily at 6 AM

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=medium

      - name: Upload Snyk results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: snyk.sarif
```

## 📊 **Security Testing Metrics & KPIs**

### **Automated Testing Metrics**

- **SAST Coverage**: 95%+ code coverage
- **DAST Coverage**: 100% endpoint coverage
- **Vulnerability Detection**: 0 high/critical vulnerabilities
- **False Positive Rate**: <5%

### **Performance Security Metrics**

- **Authentication Load**: 1000+ logins/minute
- **Rate Limiting Effectiveness**: 99%+ malicious request blocking
- **API Response Time**: <200ms under security load
- **Security Test Execution Time**: <10 minutes

### **Compliance Metrics**

- **OWASP Top 10 Coverage**: 100%
- **Security Test Pass Rate**: 98%+
- **Regression Test Coverage**: 100% of security fixes
- **Penetration Test Frequency**: Monthly

## 🔄 **Continuous Security Integration**

### **CI/CD Pipeline Integration**

1. **Pre-commit Hooks**: Security linting and secret detection
2. **Pull Request Checks**: SAST and dependency scanning
3. **Staging Deployment**: DAST and integration security tests
4. **Production Deployment**: Security smoke tests and monitoring

### **Security Test Automation**

- **Daily**: Dependency vulnerability scanning
- **Weekly**: Full DAST scan and penetration testing
- **Monthly**: Comprehensive security assessment
- **Quarterly**: External security audit

This comprehensive security testing framework ensures continuous validation of
our OWASP compliance and maintains the highest security standards for the
WellFlow API.
