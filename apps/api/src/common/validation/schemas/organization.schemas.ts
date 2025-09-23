import { z } from 'zod';

/**
 * Organization-related Zod schemas for validation
 */
export const organizationSchemas = {
  // Create organization schema
  createOrganization: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().optional(),
    contactEmail: z.string().email('Invalid email format').optional(),
    contactPhone: z.string().optional(),
  }),

  // Update organization schema (all fields optional)
  updateOrganization: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    contactEmail: z.string().email('Invalid email format').optional(),
    contactPhone: z.string().optional(),
  }),

  // Organization response schema
  organizationResponse: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    contactEmail: z.string().email().nullable(),
    contactPhone: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Organization with stats response
  organizationWithStatsResponse: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    contactEmail: z.string().email().nullable(),
    contactPhone: z.string().nullable(),
    stats: z.object({
      totalWells: z.number(),
      activeWells: z.number(),
      totalProduction: z.number(),
      totalUsers: z.number(),
    }),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
};
