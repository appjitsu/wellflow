import { z } from 'zod';

/**
 * User-related Zod schemas for validation
 */
export const userSchemas = {
  // Base user fields
  baseUser: z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    isActive: z.boolean().default(true),
  }),

  // Create user schema
  createUser: z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: z.string().email('Invalid email format'),
    phone: z.string().optional(),
    role: z.enum(['owner', 'manager', 'pumper'], {
      message: 'Role must be owner, manager, or pumper',
    }),
    organizationId: z.string().uuid('Invalid organization ID'),
    isActive: z.boolean().default(true),
  }),

  // Update user schema (all fields optional)
  updateUser: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().optional(),
    role: z.enum(['owner', 'manager', 'pumper']).optional(),
    isActive: z.boolean().optional(),
  }),

  // User response schema
  userResponse: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().nullable(),
    role: z.enum(['owner', 'manager', 'pumper']),
    organizationId: z.string().uuid(),
    isActive: z.boolean(),
    lastLoginAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
};
