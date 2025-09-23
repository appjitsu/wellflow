import { z } from 'zod';

/**
 * Lease-related Zod schemas for validation
 */
export const leaseSchemas = {
  // Create lease schema
  createLease: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    leaseNumber: z.string().optional(),
    lessor: z.string().min(1, 'Lessor is required'),
    lessee: z.string().min(1, 'Lessee is required'),
    acreage: z.string().optional(),
    royaltyRate: z.string().optional(),
    effectiveDate: z.string().optional(),
    expirationDate: z.string().optional(),
    legalDescription: z.string().optional(),
  }),

  // Update lease schema (all fields optional)
  updateLease: z.object({
    name: z.string().min(1).max(255).optional(),
    leaseNumber: z.string().optional(),
    lessor: z.string().min(1).optional(),
    lessee: z.string().min(1).optional(),
    acreage: z.string().optional(),
    royaltyRate: z.string().optional(),
    effectiveDate: z.string().optional(),
    expirationDate: z.string().optional(),
    status: z.string().optional(),
    legalDescription: z.string().optional(),
  }),

  // Lease response schema
  leaseResponse: z.object({
    id: z.string().uuid(),
    name: z.string(),
    leaseNumber: z.string().nullable(),
    lessor: z.string(),
    lessee: z.string(),
    acreage: z.string().nullable(),
    royaltyRate: z.string().nullable(),
    effectiveDate: z.date().nullable(),
    expirationDate: z.date().nullable(),
    status: z.string(),
    legalDescription: z.string().nullable(),
    organizationId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Lease query parameters
  leaseQuery: z.object({
    status: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),
};
