// Auth hooks tests
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile, useChangePassword, useActivityHistory } from '../use-auth';
import { authApi } from '../../lib/api/auth';

// Mock the auth API
jest.mock('../../lib/api/auth');
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
const mockToast = toast as jest.Mocked<typeof toast>;

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Auth Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockUser = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        role: 'owner' as const,
        isActive: true,
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthApi.getCurrentProfile.mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
      expect(mockAuthApi.getCurrentProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle profile fetch error', async () => {
      const error = { status: 401, message: 'Unauthorized' };
      mockAuthApi.getCurrentProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfile(), {
        wrapper: createWrapper(),
      });

      // Wait for the query to fail
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
      expect(mockAuthApi.getCurrentProfile).toHaveBeenCalled();
    });
  });

  describe('useUpdateProfile', () => {
    it('should update profile successfully', async () => {
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1987654321',
      };

      const updatedUser = {
        id: '1',
        ...profileData,
        role: 'owner' as const,
        isActive: true,
        organizationId: 'org-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthApi.updateProfile.mockResolvedValueOnce(updatedUser);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(profileData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthApi.updateProfile).toHaveBeenCalledWith(profileData);
      expect(mockToast.success).toHaveBeenCalledWith(
        'Profile updated successfully!',
        expect.objectContaining({
          description: 'Your profile information has been saved.',
        })
      );
    });

    it('should handle profile update error', async () => {
      const error = new Error('Update failed');
      mockAuthApi.updateProfile.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to update profile',
        expect.objectContaining({
          description: 'Update failed',
        })
      );
    });
  });

  describe('useChangePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123!',
        confirmPassword: 'newPassword123!',
      };

      const response = {
        message: 'Password changed successfully',
        changedAt: new Date(),
      };

      mockAuthApi.changePassword.mockResolvedValueOnce(response);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(passwordData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAuthApi.changePassword).toHaveBeenCalledWith(passwordData);
      expect(mockToast.success).toHaveBeenCalledWith(
        'Password changed successfully!',
        expect.objectContaining({
          description:
            'Your password has been updated. Please use your new password for future logins.',
        })
      );
    });

    it('should handle password change error', async () => {
      const error = new Error('Current password is incorrect');
      mockAuthApi.changePassword.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useChangePassword(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!',
        confirmPassword: 'newPassword123!',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith(
        'Failed to change password',
        expect.objectContaining({
          description: 'Current password is incorrect',
        })
      );
    });
  });

  describe('useActivityHistory', () => {
    it('should fetch activity history successfully', async () => {
      const mockActivities = [
        {
          id: '1',
          type: 'login' as const,
          description: 'Successful login',
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          location: 'San Francisco, CA',
          success: true,
        },
        {
          id: '2',
          type: 'password_change' as const,
          description: 'Password changed',
          timestamp: new Date(),
          success: true,
        },
      ];

      mockAuthApi.getActivityHistory.mockResolvedValueOnce(mockActivities);

      const { result } = renderHook(() => useActivityHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockActivities);
      expect(mockAuthApi.getActivityHistory).toHaveBeenCalledTimes(1);
    });

    it('should handle activity history fetch error', async () => {
      const error = { status: 401, message: 'Failed to fetch activity history' };
      mockAuthApi.getActivityHistory.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useActivityHistory(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });
});
