import LogRocket from 'logrocket';
import { initLogRocket, identifyUser, captureException, addTag } from '../logrocket';

// Mock LogRocket
jest.mock('logrocket', () => ({
  init: jest.fn(),
  identify: jest.fn(),
  captureException: jest.fn(),
  track: jest.fn(),
}));

// Mock LogRocket React setup
jest.mock('logrocket-react', () => jest.fn());

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('LogRocket Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleError.mockClear();

    // Ensure window is defined for most tests
    (global as unknown as { window: object }).window = {};
    process.env.NEXT_PUBLIC_LOGROCKET_APP_ID = 'test-app-id';
  });

  describe('initLogRocket', () => {
    it('should call initLogRocket without throwing errors', () => {
      expect(() => initLogRocket()).not.toThrow();
    });

    it('should handle missing app ID gracefully', () => {
      const originalAppId = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;
      delete process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

      expect(() => initLogRocket()).not.toThrow();

      // Restore original value
      if (originalAppId) {
        process.env.NEXT_PUBLIC_LOGROCKET_APP_ID = originalAppId;
      }
    });

    it('should handle window undefined gracefully', () => {
      const originalWindow = (global as typeof globalThis).window;
      delete (global as Record<string, unknown>).window;

      expect(() => initLogRocket()).not.toThrow();

      // Restore window
      (global as typeof globalThis).window = originalWindow;
    });

    it('should initialize LogRocket without errors', () => {
      process.env.NEXT_PUBLIC_LOGROCKET_APP_ID = 'test-app-id';

      expect(() => initLogRocket()).not.toThrow();
    });

    it('should handle LogRocket initialization with configuration', () => {
      process.env.NEXT_PUBLIC_LOGROCKET_APP_ID = 'test-app-id';

      // Test that initialization completes without errors
      expect(() => initLogRocket()).not.toThrow();
    });

    it('should handle LogRocket initialization errors gracefully', () => {
      process.env.NEXT_PUBLIC_LOGROCKET_APP_ID = 'test-app-id';
      const error = new Error('Init failed');
      (LogRocket.init as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Should not throw even when LogRocket.init fails
      expect(() => initLogRocket()).not.toThrow();
    });
  });

  describe('identifyUser', () => {
    it('should call identifyUser without throwing errors', () => {
      expect(() => identifyUser('user123', { name: 'John Doe' })).not.toThrow();
    });

    it('should handle undefined user info gracefully', () => {
      expect(() => identifyUser('user123')).not.toThrow();
    });

    it('should handle LogRocket errors gracefully', () => {
      const error = new Error('Identification failed');
      (LogRocket.identify as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => identifyUser('user123', { name: 'John' })).not.toThrow();
    });
  });

  describe('captureException', () => {
    it('should call captureException without throwing errors', () => {
      const error = new Error('Test error');
      expect(() => captureException(error)).not.toThrow();
    });

    it('should handle extra data gracefully', () => {
      const error = new Error('Test error');
      const extra = { context: 'test', userId: '123' };
      expect(() => captureException(error, extra)).not.toThrow();
    });

    it('should handle LogRocket errors gracefully', () => {
      const error = new Error('Test error');
      const captureError = new Error('Capture failed');
      (LogRocket.captureException as jest.Mock).mockImplementation(() => {
        throw captureError;
      });

      expect(() => captureException(error)).not.toThrow();
    });
  });

  describe('addTag', () => {
    it('should call addTag without throwing errors', () => {
      expect(() => addTag('feature', 'user-management')).not.toThrow();
    });

    it('should handle LogRocket errors gracefully', () => {
      const error = new Error('Track failed');
      (LogRocket.track as jest.Mock).mockImplementation(() => {
        throw error;
      });

      expect(() => addTag('feature', 'test')).not.toThrow();
    });
  });
});
