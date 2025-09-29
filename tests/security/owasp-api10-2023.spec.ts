import { test, expect } from '@playwright/test';

/**
 * OWASP API Security Top 10 2023 - API10:2023 Tests
 *
 * Tests for Unsafe Consumption of APIs security implementation
 * Validates SSRF protection, response validation, and external API security
 */

test.describe('OWASP API10:2023 - Unsafe Consumption of APIs', () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  test.beforeEach(async ({ page }) => {
    // Set up authentication if needed
    // This would typically involve logging in or setting auth tokens
  });

  test('should block SSRF attacks on internal networks', async ({ request }) => {
    // Test SSRF protection by attempting to access internal network addresses
    const maliciousUrls = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://192.168.1.1',
      'http://10.0.0.1',
      'http://169.254.169.254', // AWS metadata service
      'http://metadata.google.internal', // GCP metadata service
    ];

    for (const maliciousUrl of maliciousUrls) {
      const response = await request.post(`${API_BASE_URL}/test/ssrf-protection`, {
        data: { url: maliciousUrl },
        failOnStatusCode: false,
      });

      // SSRF protection should block these requests
      expect(response.status()).toBeGreaterThanOrEqual(400);

      const responseBody = await response.text();
      expect(responseBody.toLowerCase()).toContain('ssrf');
    }
  });

  test('should validate external API response sizes', async ({ request }) => {
    // Test response size limits to prevent DoS attacks
    const response = await request.get(`${API_BASE_URL}/health/external-services`, {
      failOnStatusCode: false,
    });

    if (response.ok()) {
      const responseText = await response.text();
      const responseSize = responseText.length;

      // Response should be reasonable size (< 1MB for health check)
      expect(responseSize).toBeLessThan(1024 * 1024);
    }
  });

  test('should sanitize malicious content in API responses', async ({ request }) => {
    // Test malicious content detection and sanitization
    const maliciousPayloads = [
      '<script>alert("xss")</script>',
      '<iframe src="javascript:alert(1)"></iframe>',
      'javascript:alert("malicious")',
      'eval("dangerous code")',
      'document.cookie',
    ];

    for (const payload of maliciousPayloads) {
      const response = await request.post(`${API_BASE_URL}/test/response-validation`, {
        data: { content: payload },
        failOnStatusCode: false,
      });

      if (response.ok()) {
        const responseBody = await response.text();

        // Malicious content should be sanitized or removed
        expect(responseBody).not.toContain('<script>');
        expect(responseBody).not.toContain('<iframe>');
        expect(responseBody).not.toContain('javascript:');
        expect(responseBody).not.toContain('eval(');
      } else {
        // Or the request should be blocked entirely
        expect(response.status()).toBeGreaterThanOrEqual(400);
      }
    }
  });

  test('should implement circuit breaker for external APIs', async ({ request }) => {
    // Test circuit breaker pattern implementation
    const response = await request.get(`${API_BASE_URL}/health/detailed`);

    if (response.ok()) {
      const healthData = await response.json();

      // Should have circuit breaker information
      expect(healthData).toHaveProperty('resilience');
      expect(healthData.resilience).toHaveProperty('circuitBreakers');

      // Should have circuit breakers for external services
      const circuitBreakers = healthData.resilience.circuitBreakers;
      expect(Array.isArray(circuitBreakers)).toBeTruthy();

      // Should have regulatory and ERP service circuit breakers
      const serviceNames = circuitBreakers.map((cb: any) => cb.serviceName);
      expect(serviceNames).toContain('regulatory-api');
      expect(serviceNames).toContain('erp');
    }
  });

  test('should validate content types from external APIs', async ({ request }) => {
    // Test content type validation
    const dangerousContentTypes = [
      'text/html',
      'application/javascript',
      'text/javascript',
      'application/x-javascript',
    ];

    for (const contentType of dangerousContentTypes) {
      const response = await request.post(`${API_BASE_URL}/test/content-type-validation`, {
        data: { contentType },
        failOnStatusCode: false,
      });

      // Dangerous content types should be rejected
      if (response.status() < 400) {
        const responseBody = await response.json();
        // If accepted, should indicate content type was sanitized/rejected
        expect(responseBody).toHaveProperty('contentTypeValidation');
        expect(responseBody.contentTypeValidation).toBe('rejected');
      }
    }
  });

  test('should log security violations for audit', async ({ request }) => {
    // Test that security violations are properly logged
    const response = await request.post(`${API_BASE_URL}/test/security-violation`, {
      data: {
        maliciousContent: '<script>alert("audit test")</script>',
        testType: 'audit-logging',
      },
      failOnStatusCode: false,
    });

    // Should either block the request or log the violation
    if (response.ok()) {
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('auditLogged');
      expect(responseBody.auditLogged).toBe(true);
    } else {
      // Blocked requests should return appropriate error codes
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('should implement timeout protection for external APIs', async ({ request }) => {
    // Test timeout protection to prevent hanging requests
    const startTime = Date.now();

    const response = await request.post(`${API_BASE_URL}/test/timeout-protection`, {
      data: { simulateTimeout: true },
      failOnStatusCode: false,
      timeout: 15000, // 15 second timeout
    });

    const duration = Date.now() - startTime;

    // Should timeout within reasonable time (< 12 seconds, allowing for SSRF service 10s timeout + overhead)
    expect(duration).toBeLessThan(12000);

    if (!response.ok()) {
      const responseBody = await response.text();
      expect(responseBody.toLowerCase()).toMatch(/timeout|time.*out/);
    }
  });

  test('should validate regulatory API security integration', async ({ request }) => {
    // Test that regulatory API adapter uses security controls
    const response = await request.get(`${API_BASE_URL}/health/external-services`);

    if (response.ok()) {
      const healthData = await response.json();

      // Should have information about external service security
      expect(healthData).toHaveProperty('externalServices');

      if (healthData.externalServices) {
        // Should indicate security controls are active
        const services = Object.keys(healthData.externalServices);
        expect(services.length).toBeGreaterThan(0);

        // Each service should have security status
        for (const service of services) {
          const serviceInfo = healthData.externalServices[service];
          expect(serviceInfo).toHaveProperty('securityControls');
        }
      }
    }
  });

  test('should validate ERP API security integration', async ({ request }) => {
    // Test that ERP API adapter uses security controls
    const response = await request.get(`${API_BASE_URL}/health/detailed`);

    if (response.ok()) {
      const healthData = await response.json();

      // Should have circuit breaker for ERP service
      if (healthData.resilience && healthData.resilience.circuitBreakers) {
        const erpCircuitBreaker = healthData.resilience.circuitBreakers.find(
          (cb: any) => cb.serviceName === 'erp'
        );

        if (erpCircuitBreaker) {
          expect(erpCircuitBreaker).toHaveProperty('state');
          expect(erpCircuitBreaker).toHaveProperty('failureCount');
          expect(erpCircuitBreaker).toHaveProperty('successCount');
        }
      }
    }
  });

  test('should prevent XML external entity (XXE) attacks', async ({ request }) => {
    // Test XXE protection in XML responses
    const xxePayload = `<?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE foo [
        <!ENTITY xxe SYSTEM "file:///etc/passwd">
      ]>
      <data>&xxe;</data>`;

    const response = await request.post(`${API_BASE_URL}/test/xml-validation`, {
      data: { xmlContent: xxePayload },
      headers: { 'Content-Type': 'application/xml' },
      failOnStatusCode: false,
    });

    // XXE attacks should be blocked
    if (response.ok()) {
      const responseBody = await response.text();
      expect(responseBody).not.toContain('/etc/passwd');
      expect(responseBody).not.toContain('root:');
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });

  test('should validate API response validator service', async ({ request }) => {
    // Test the API response validator service directly
    const testPayloads = [
      {
        name: 'Clean JSON',
        data: { message: 'Hello, world!' },
        shouldPass: true,
      },
      {
        name: 'XSS in JSON',
        data: { message: '<script>alert("xss")</script>' },
        shouldPass: false,
      },
      {
        name: 'SQL Injection in JSON',
        data: { query: "'; DROP TABLE users; --" },
        shouldPass: false,
      },
      {
        name: 'Large Response',
        data: { data: 'x'.repeat(11 * 1024 * 1024) }, // 11MB
        shouldPass: false,
      },
    ];

    for (const payload of testPayloads) {
      const response = await request.post(`${API_BASE_URL}/test/response-validator`, {
        data: payload.data,
        failOnStatusCode: false,
      });

      if (payload.shouldPass) {
        expect(response.ok()).toBeTruthy();
      } else {
        // Should either be blocked or sanitized
        if (response.ok()) {
          const responseBody = await response.json();
          expect(responseBody).toHaveProperty('sanitized');
          expect(responseBody.sanitized).toBe(true);
        } else {
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      }
    }
  });

  test('should implement proper error handling for security violations', async ({ request }) => {
    // Test that security violations return appropriate error messages
    const response = await request.post(`${API_BASE_URL}/test/security-error-handling`, {
      data: {
        triggerSecurityViolation: true,
        violationType: 'ssrf',
      },
      failOnStatusCode: false,
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);

    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toHaveProperty('code');
    expect(responseBody.error).toHaveProperty('message');

    // Should not expose internal details
    expect(responseBody.error.message).not.toContain('stack');
    expect(responseBody.error.message).not.toContain('internal');

    // Should indicate security violation
    expect(responseBody.error.code).toMatch(/SECURITY|SSRF|VALIDATION/);
  });
});
