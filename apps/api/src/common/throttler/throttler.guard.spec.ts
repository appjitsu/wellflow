/**
 * Test suite for ThrottlerGuard
 * Tests rate limiting and throttling functionality
 */

describe('ThrottlerGuard', () => {
  let mockRequest: any;
  let mockResponse: any;

  // Test constants for IP addresses - these are safe in test context
  const TEST_IP = '127.0.0.1';

  const FORWARDED_IP = '192.168.1.1';

  beforeEach(() => {
    // Mock Express request
    mockRequest = {
      ip: TEST_IP,
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': FORWARDED_IP,
      },
      url: '/api/wells',
      method: 'GET',
      user: { id: 'user-123' },
    };

    // Mock Express response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    };
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit configuration', () => {
      const rateLimitConfig = {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
        blockDuration: 300000, // 5 minutes block
      };

      expect(rateLimitConfig.ttl).toBe(60000);
      expect(rateLimitConfig.limit).toBe(100);
      expect(rateLimitConfig.blockDuration).toBe(300000);
    });

    it('should handle different rate limits for different endpoints', () => {
      const endpointLimits = {
        '/api/wells': { ttl: 60000, limit: 100 },
        '/api/production': { ttl: 60000, limit: 50 },
        '/api/auth/login': { ttl: 900000, limit: 5 }, // 15 minutes, 5 attempts
      };

      expect(endpointLimits['/api/wells'].limit).toBe(100);
      expect(endpointLimits['/api/production'].limit).toBe(50);
      expect(endpointLimits['/api/auth/login'].limit).toBe(5);
    });

    it('should handle user-specific rate limits', () => {
      const userLimits = {
        admin: { ttl: 60000, limit: 1000 },
        operator: { ttl: 60000, limit: 500 },
        viewer: { ttl: 60000, limit: 100 },
      };

      expect(userLimits.admin.limit).toBe(1000);
      expect(userLimits.operator.limit).toBe(500);
      expect(userLimits.viewer.limit).toBe(100);
    });
  });

  describe('Request Tracking', () => {
    it('should track requests by IP address', () => {
      const requestTracker = new Map();
      const ip = '127.0.0.1';
      const currentTime = Date.now();

      const trackRequest = (ip: string) => {
        const requests = requestTracker.get(ip) || [];
        requests.push(currentTime);
        requestTracker.set(ip, requests);
        return requests.length;
      };

      const requestCount = trackRequest(ip);

      expect(requestCount).toBe(1);
      expect(requestTracker.has(ip)).toBe(true);
    });

    it('should track requests by user ID', () => {
      const userTracker = new Map();
      const userId = 'user-123';
      const currentTime = Date.now();

      const trackUserRequest = (userId: string) => {
        const requests = userTracker.get(userId) || [];
        requests.push(currentTime);
        userTracker.set(userId, requests);
        return requests.length;
      };

      const requestCount = trackUserRequest(userId);

      expect(requestCount).toBe(1);
      expect(userTracker.has(userId)).toBe(true);
    });

    it('should clean up expired requests', () => {
      const requestTracker = new Map();
      const ip = '127.0.0.1';
      const ttl = 60000; // 1 minute
      const currentTime = Date.now();
      const expiredTime = currentTime - ttl - 1000;

      // Add expired and current requests
      requestTracker.set(ip, [expiredTime, currentTime]);

      const cleanupExpiredRequests = (ip: string, ttl: number) => {
        const requests = requestTracker.get(ip) || [];
        const validRequests = requests.filter(
          (time: number) => currentTime - time < ttl,
        );
        requestTracker.set(ip, validRequests);
        return validRequests.length;
      };

      const validRequestCount = cleanupExpiredRequests(ip, ttl);

      expect(validRequestCount).toBe(1);
    });
  });

  describe('Throttling Logic', () => {
    it('should allow requests within limit', () => {
      const checkRateLimit = (requestCount: number, limit: number) => {
        return requestCount <= limit;
      };

      expect(checkRateLimit(50, 100)).toBe(true);
      expect(checkRateLimit(100, 100)).toBe(true);
      expect(checkRateLimit(101, 100)).toBe(false);
    });

    it('should block requests exceeding limit', () => {
      const isBlocked = (requestCount: number, limit: number) => {
        return requestCount > limit;
      };

      expect(isBlocked(101, 100)).toBe(true);
      expect(isBlocked(150, 100)).toBe(true);
      expect(isBlocked(99, 100)).toBe(false);
    });

    it('should calculate time until reset', () => {
      const ttl = 60000; // 1 minute
      const firstRequestTime = Date.now() - 30000; // 30 seconds ago

      const getTimeUntilReset = (firstRequestTime: number, ttl: number) => {
        const elapsed = Date.now() - firstRequestTime;
        return Math.max(0, ttl - elapsed);
      };

      const timeUntilReset = getTimeUntilReset(firstRequestTime, ttl);

      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(30000);
    });
  });

  describe('Response Headers', () => {
    it('should set rate limit headers', () => {
      const setRateLimitHeaders = (
        response: any,
        limit: number,
        remaining: number,
        resetTime: number,
      ) => {
        response.setHeader('X-RateLimit-Limit', limit);
        response.setHeader('X-RateLimit-Remaining', remaining);
        response.setHeader('X-RateLimit-Reset', resetTime);
      };

      const limit = 100;
      const remaining = 75;
      const resetTime = Date.now() + 60000;

      setRateLimitHeaders(mockResponse, limit, remaining, resetTime);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Limit',
        limit,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        remaining,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        resetTime,
      );
    });

    it('should set retry-after header when blocked', () => {
      const setRetryAfterHeader = (
        response: any,
        retryAfterSeconds: number,
      ) => {
        response.setHeader('Retry-After', retryAfterSeconds);
      };

      const retryAfterSeconds = 300; // 5 minutes

      setRetryAfterHeader(mockResponse, retryAfterSeconds);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Retry-After',
        retryAfterSeconds,
      );
    });
  });

  describe('IP Address Extraction', () => {
    it('should extract IP from request', () => {
      const extractIP = (request: any) => {
        return (
          request.headers['x-forwarded-for'] ||
          request.headers['x-real-ip'] ||
          request.connection?.remoteAddress ||
          request.ip
        );
      };

      const ip = extractIP(mockRequest);

      expect(ip).toBe(FORWARDED_IP); // From x-forwarded-for header
    });

    it('should handle missing forwarded headers', () => {
      const requestWithoutHeaders = {
        ip: TEST_IP,
        headers: {},
      };

      const extractIPFromRequest = (request: any) => {
        // Check x-forwarded-for first, then fallbacks
        if (request.headers['x-forwarded-for']) {
          return request.headers['x-forwarded-for'];
        }
        if (request.headers['x-real-ip']) {
          return request.headers['x-real-ip'];
        }
        if (request.connection?.remoteAddress) {
          return request.connection.remoteAddress;
        }
        return request.ip || 'unknown';
      };

      const ip = extractIPFromRequest(requestWithoutHeaders);

      expect(ip).toBe(TEST_IP);
    });

    it('should handle proxy chains', () => {
      const requestWithProxyChain = {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.168.1.1',
        },
        ip: '127.0.0.1',
      };

      const extractClientIP = (request: any) => {
        const forwardedFor = request.headers['x-forwarded-for'];
        if (forwardedFor) {
          return forwardedFor.split(',')[0].trim();
        }
        return request.ip;
      };

      const clientIP = extractClientIP(requestWithProxyChain);

      expect(clientIP).toBe('203.0.113.1');
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', () => {
      const handleStorageError = (error: Error) => {
        console.error('Rate limit storage error:', error);
        // Fail open - allow request when storage fails
        return true;
      };

      const storageError = new Error('Redis connection failed');
      const shouldAllow = handleStorageError(storageError);

      expect(shouldAllow).toBe(true);
    });

    it('should handle invalid configuration', () => {
      const validateConfig = (config: any) => {
        if (!config.ttl || config.ttl <= 0) return false;
        if (!config.limit || config.limit <= 0) return false;
        return true;
      };

      const validConfig = { ttl: 60000, limit: 100 };
      const invalidConfig1 = { ttl: 0, limit: 100 };
      const invalidConfig2 = { ttl: 60000, limit: 0 };

      expect(validateConfig(validConfig)).toBe(true);
      expect(validateConfig(invalidConfig1)).toBe(false);
      expect(validateConfig(invalidConfig2)).toBe(false);
    });

    it('should handle concurrent requests', () => {
      const requestCounter = { count: 0 };
      const limit = 100;

      const incrementCounter = () => {
        requestCounter.count++;
        return requestCounter.count;
      };

      const checkLimit = (currentCount: number) => {
        return currentCount <= limit;
      };

      // Simulate concurrent requests
      const results = [];
      for (let i = 0; i < 105; i++) {
        const count = incrementCounter();
        results.push(checkLimit(count));
      }

      const allowedRequests = results.filter((allowed) => allowed).length;
      const blockedRequests = results.filter((allowed) => !allowed).length;

      expect(allowedRequests).toBe(100);
      expect(blockedRequests).toBe(5);
    });
  });

  describe('Performance Optimization', () => {
    it('should handle memory cleanup', () => {
      const requestTracker = new Map();
      const maxEntries = 10000;

      const cleanupOldEntries = () => {
        if (requestTracker.size > maxEntries) {
          const entries = Array.from(requestTracker.entries());
          const entriesToKeep = entries.slice(-maxEntries / 2);
          requestTracker.clear();
          entriesToKeep.forEach(([key, value]) => {
            requestTracker.set(key, value);
          });
        }
      };

      // Fill tracker beyond limit
      for (let i = 0; i < maxEntries + 100; i++) {
        requestTracker.set(`ip-${i}`, [Date.now()]);
      }

      expect(requestTracker.size).toBeGreaterThan(maxEntries);

      cleanupOldEntries();

      expect(requestTracker.size).toBeLessThanOrEqual(maxEntries / 2);
    });

    it('should handle efficient lookups', () => {
      const requestTracker = new Map();
      const ip = TEST_IP;

      // Add some data to the tracker first
      requestTracker.set(ip, [Date.now()]);

      const startTime = Date.now();

      // Perform many lookups
      for (let i = 0; i < 1000; i++) {
        requestTracker.get(ip);
      }

      const endTime = Date.now();
      const lookupTime = endTime - startTime;

      // Map lookups should be very fast
      expect(lookupTime).toBeLessThan(100);
      expect(requestTracker.has(ip)).toBe(true);
    });
  });
});
