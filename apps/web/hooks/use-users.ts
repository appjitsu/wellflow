'use client';

import { useState, useEffect, useCallback } from 'react';
import { userApi, ApiError } from '../lib/api/users';
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  InviteUserRequest,
  UserRole,
  UseUsersReturn,
} from '../types/user';

/**
 * Custom hook for user management operations
 * Provides CRUD operations with loading states and error handling
 */
export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await userApi.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new user
  const createUser = useCallback(async (userData: CreateUserRequest): Promise<User> => {
    try {
      setError(null);
      const newUser = await userApi.createUser(userData);
      setUsers((prevUsers) => [...prevUsers, newUser]);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Update existing user
  const updateUser = useCallback(async (id: string, userData: UpdateUserRequest): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await userApi.updateUser(id, userData);
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === id ? updatedUser : user)));
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await userApi.deleteUser(id);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete user';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Invite new user
  const inviteUser = useCallback(
    async (inviteData: InviteUserRequest): Promise<void> => {
      try {
        setError(null);
        await userApi.inviteUser(inviteData);
        // Refresh users list to show the invited user
        await fetchUsers();
      } catch (err) {
        const errorMessage = err instanceof ApiError ? err.message : 'Failed to invite user';
        setError(errorMessage);
        throw err;
      }
    },
    [fetchUsers]
  );

  // Assign role to user
  const assignRole = useCallback(async (id: string, role: UserRole): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await userApi.assignRole(id, role);
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === id ? updatedUser : user)));
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to assign role';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Toggle user active status
  const toggleUserStatus = useCallback(async (id: string, isActive: boolean): Promise<User> => {
    try {
      setError(null);
      const updatedUser = await userApi.toggleUserStatus(id, isActive);
      setUsers((prevUsers) => prevUsers.map((user) => (user.id === id ? updatedUser : user)));
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update user status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Refetch users (useful for manual refresh)
  const refetch = useCallback(async (): Promise<void> => {
    await fetchUsers();
  }, [fetchUsers]);

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch,
    createUser,
    updateUser,
    deleteUser,
    inviteUser,
    assignRole: assignRole,
  };
}
