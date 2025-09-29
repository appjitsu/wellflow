// Auth API Tests
/* eslint-disable sonarjs/no-hardcoded-passwords, sonarjs/no-hardcoded-ip */
import { authApi, ApiError } from '../auth';
import type { ActivityEvent } from '../../../types/user';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const mockResponse = {
        message: 'Password changed successfully',
        changedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authApi.changePassword({
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123!',
        confirmPassword: 'newPassword123!',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/auth/change-password',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
          body: JSON.stringify({
            currentPassword: 'oldPassword123',
            newPassword: 'newPassword123!',
            confirmPassword: 'newPassword123!',
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle password change errors', async () => {
      const errorResponse = {
        message: 'Current password is incorrect',
        code: 'INVALID_PASSWORD',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => errorResponse,
      } as Response);

      await expect(
        authApi.changePassword({
          currentPassword: 'wrongPassword',
          newPassword: 'newPassword123!',
          confirmPassword: 'newPassword123!',
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getCurrentProfile', () => {
    it('should fetch current user profile', async () => {
      const mockUser = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        role: 'USER',
        isActive: true,
        organizationId: 'org-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await authApi.getCurrentProfile();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/auth/profile',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
        })
      );

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
      };

      const mockUpdatedUser = {
        id: '1',
        ...profileData,
        role: 'USER',
        isActive: true,
        organizationId: 'org-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUpdatedUser,
      } as Response);

      const result = await authApi.updateProfile(profileData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/users/profile',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
          body: JSON.stringify(profileData),
        })
      );

      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('getActivityHistory', () => {
    it('should fetch activity history with date conversion', async () => {
      const mockActivities = [
        {
          id: '1',
          type: 'login',
          description: 'Successful login',
          timestamp: '2024-01-01T10:00:00Z',
          ipAddress: '192.168.1.1',
          location: 'San Francisco, CA',
          success: true,
        },
        {
          id: '2',
          type: 'password_change',
          description: 'Password changed',
          timestamp: '2024-01-02T15:30:00Z',
          success: true,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockActivities,
      } as Response);

      const result = await authApi.getActivityHistory();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/users/activity',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer mock-token',
          }),
        })
      );

      // Check that timestamps are converted to Date objects
      expect(result).toHaveLength(2);
      const activities = result as ActivityEvent[];
      const firstActivity = activities[0];
      const secondActivity = activities[1];
      expect(firstActivity).toBeDefined();
      expect(secondActivity).toBeDefined();
      if (firstActivity && secondActivity) {
        expect(firstActivity.timestamp).toBeInstanceOf(Date);
        expect(secondActivity.timestamp).toBeInstanceOf(Date);
        expect(firstActivity.timestamp.toISOString()).toBe('2024-01-01T10:00:00.000Z');
      }
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockLoginResponse = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          role: 'USER',
          isActive: true,
          organizationId: 'org-1',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLoginResponse,
      } as Response);

      const result = await authApi.login('john.doe@example.com', 'password123', true);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'john.doe@example.com',
            password: 'password123',
            rememberMe: true,
          }),
        })
      );

      expect(result).toEqual(mockLoginResponse);
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('Test error', 400, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('ApiError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Network errors', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authApi.getCurrentProfile()).rejects.toThrow(ApiError);
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers(),
        redirected: false,
        statusText: 'Internal Server Error',
        type: 'basic',
        url: '',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        text: jest.fn(),
        bytes: jest.fn(),
      } as unknown as Response);

      await expect(authApi.getCurrentProfile()).rejects.toThrow(ApiError);
    });
  });
});
