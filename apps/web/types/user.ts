// User Management Types - Following strict TypeScript practices (no 'any' types)

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  organizationId: string | null;
  role: UserRole | null;
  phone?: string | null;
  isActive: boolean;
  emailVerified?: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'owner' | 'manager' | 'pumper';

export interface CreateUserRequest {
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  isActive?: boolean;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

export interface AssignRoleRequest {
  role: UserRole;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form validation schemas
export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  organizationId: string;
  isActive: boolean;
}

export interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

// Component prop types
export interface UserListProps {
  users: User[];
  loading?: boolean;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onAssignRole: (userId: string, role: UserRole) => void;
  onToggleStatus: (userId: string, isActive: boolean) => void;
}

export interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export interface InviteUserFormProps {
  onSubmit: (data: InviteFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// Filter and sort types
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  organizationId?: string;
}

export type UserSortField =
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'createdAt'
  | 'lastLoginAt';
export type SortDirection = 'asc' | 'desc';

export interface UserSort {
  field: UserSortField;
  direction: SortDirection;
}

// Hook return types
export interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<User>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  inviteUser: (data: InviteUserRequest) => Promise<void>;
  assignRole: (id: string, role: UserRole) => Promise<User>;
}

export interface UseUserFormReturn {
  formData: UserFormData;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleChange: (field: keyof UserFormData, value: string | boolean) => void;
  reset: () => void;
}
