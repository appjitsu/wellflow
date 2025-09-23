import { z } from 'zod';

/**
 * Production-related Zod schemas for validation
 */
export const productionSchemas = {
  // Create production record schema
  createProductionRecord: z.object({
    wellId: z.string().uuid('Invalid well ID'),
    productionDate: z.string(),
    oilVolume: z.string().optional(),
    gasVolume: z.string().optional(),
    waterVolume: z.string().optional(),
    notes: z.string().optional(),
  }),

  // Update production record schema (all fields optional)
  updateProductionRecord: z.object({
    oilVolume: z.string().optional(),
    gasVolume: z.string().optional(),
    waterVolume: z.string().optional(),
    notes: z.string().optional(),
  }),

  // Production record response schema
  productionRecordResponse: z.object({
    id: z.string().uuid(),
    wellId: z.string().uuid(),
    productionDate: z.date(),
    oilVolume: z.string().nullable(),
    gasVolume: z.string().nullable(),
    waterVolume: z.string().nullable(),
    notes: z.string().nullable(),
    organizationId: z.string().uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Production records by well query
  productionByWellQuery: z.object({
    wellId: z.string().uuid('Invalid well ID'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),

  // Bulk production insert schema
  bulkProductionInsert: z
    .array(
      z.object({
        wellId: z.string().uuid(),
        productionDate: z.string(),
        oilVolume: z.string().optional(),
        gasVolume: z.string().optional(),
        waterVolume: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, 'At least one production record is required')
    .max(1000, 'Maximum 1000 records per bulk insert'),
};
