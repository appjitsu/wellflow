// Authentication hooks using React Query
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi, type ChangePasswordRequest, type ProfileUpdateRequest } from '../lib/api/auth';
import type { User } from '../types/user';

// Query keys for React Query
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  activity: () => [...authKeys.all, 'activity'] as const,
};

/**
 * Hook to get current user profile
 */
export function useProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authApi.getCurrentProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.status === 401 || error?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => authApi.updateProfile(data),
    onSuccess: (updatedUser: User) => {
      // Update the profile cache
      queryClient.setQueryData(authKeys.profile(), updatedUser);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: authKeys.activity() });

      toast.success('Profile updated successfully!', {
        description: 'Your profile information has been saved.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to update profile', {
        description: error?.message || 'Please try again later',
      });
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      // Invalidate activity history to show password change event
      queryClient.invalidateQueries({ queryKey: authKeys.activity() });

      toast.success('Password changed successfully!', {
        description:
          'Your password has been updated. Please use your new password for future logins.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to change password', {
        description: error?.message || 'Please check your current password and try again',
      });
    },
  });
}

/**
 * Hook to get user activity history
 */
export function useActivityHistory() {
  return useQuery({
    queryKey: authKeys.activity(),
    queryFn: authApi.getActivityHistory,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to login user
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      email,
      password,
      rememberMe,
    }: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => authApi.login(email, password, rememberMe),
    onSuccess: (data) => {
      // Store tokens
      localStorage.setItem('auth_token', data.accessToken);
      localStorage.setItem('refresh_token', data.refreshToken);

      // Set user profile in cache
      queryClient.setQueryData(authKeys.profile(), data.user);

      toast.success('Login successful!', {
        description: `Welcome back, ${data.user.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast.error('Login failed', {
        description: error?.message || 'Please check your credentials and try again',
      });
    },
  });
}

/**
 * Hook to logout user
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');

      // Clear all cached data
      queryClient.clear();

      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      // Still clear tokens even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();

      toast.error('Logout failed', {
        description: 'You have been logged out locally',
      });
    },
  });
}
