// User Management API Service - Following established patterns in the codebase

import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  InviteUserRequest,
  AssignRoleRequest,
  ApiResponse,
  UserRole,
} from '../../types/user';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request handler with proper error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if available (JWT token)
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        // If not JSON, use the text as is
        errorMessage = errorText || errorMessage;
      }

      throw new ApiError(errorMessage, response.status, response);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // For non-JSON responses (like delete operations)
    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network or other errors
    throw new ApiError(error instanceof Error ? error.message : 'An unknown error occurred', 0);
  }
}

// User API functions
export const userApi = {
  // Get all users
  async getUsers(): Promise<User[]> {
    return apiRequest<User[]>('/users');
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    return apiRequest<User>(`/users/${id}`);
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User> {
    return apiRequest<User>(`/users/email/${encodeURIComponent(email)}`);
  },

  // Create new user
  async createUser(userData: CreateUserRequest): Promise<User> {
    return apiRequest<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    return apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    return apiRequest<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Invite user
  async inviteUser(inviteData: InviteUserRequest): Promise<ApiResponse<void>> {
    return apiRequest<ApiResponse<void>>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  },

  // Assign role to user
  async assignRole(id: string, role: UserRole): Promise<User> {
    const roleData: AssignRoleRequest = { role };
    return apiRequest<User>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    });
  },

  // Toggle user active status
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  },

  // Get current user profile
  async getCurrentProfile(): Promise<User> {
    return apiRequest<User>('/auth/profile');
  },

  // Update current user profile
  async updateProfile(profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }): Promise<User> {
    return apiRequest<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get user activity history
  async getActivityHistory(): Promise<ActivityEvent[]> {
    return apiRequest<ActivityEvent[]>('/users/activity');
  },
};

// Export individual functions for easier importing
export const {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser,
  inviteUser,
  assignRole,
  toggleUserStatus,
} = userApi;
