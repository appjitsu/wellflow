// Authentication API Service
import type { User, ActivityEvent } from '../../types/user';

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error occurred', 0);
  }
}

// Password change request interface
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Profile update request interface
export interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

// Auth API functions
export const authApi = {
  // Change password
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string; changedAt: Date }> {
    return apiRequest<{ message: string; changedAt: Date }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get current user profile
  async getCurrentProfile(): Promise<User> {
    return apiRequest<User>('/auth/profile');
  },

  // Update current user profile
  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    return apiRequest<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get user activity history
  async getActivityHistory(): Promise<ActivityEvent[]> {
    const response = await apiRequest<ActivityEvent[]>('/users/activity');
    // Convert timestamp strings to Date objects
    return response.map((activity) => ({
      ...activity,
      timestamp: new Date(activity.timestamp),
    }));
  },

  // Login
  async login(
    email: string,
    password: string,
    rememberMe?: boolean
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: User;
  }> {
    return apiRequest<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe }),
    });
  },

  // Logout
  async logout(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    return apiRequest<{
      accessToken: string;
      refreshToken: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};
