import { z } from 'zod';

/**
 * Non-negative volume validation schema
 */
const nonNegativeVolumeSchema = z
  .number()
  .min(0, 'Volume must be non-negative')
  .refine((val) => Number.isFinite(val), 'Volume must be a finite number');

/**
 * Non-negative price validation schema
 */
const nonNegativePriceSchema = z
  .number()
  .min(0, 'Price must be non-negative')
  .refine((val) => Number.isFinite(val), 'Price must be a finite number');

/**
 * Production date validation schema
 */
const productionDateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format')
  .refine(
    (date) => {
      const prodDate = new Date(date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      // Production date should not be more than 1 year in the past or in the future
      return prodDate >= oneYearAgo && prodDate <= today;
    },
    {
      message:
        'Production date must be within the last year and not in the future',
    },
  );

/**
 * Production-related Zod schemas for validation
 */
export const productionSchemas = {
  // Create production record schema
  createProductionRecord: z
    .object({
      wellId: z.string().uuid('Invalid well ID'),
      productionDate: productionDateSchema,
      oilVolume: nonNegativeVolumeSchema.optional(),
      gasVolume: nonNegativeVolumeSchema.optional(),
      waterVolume: nonNegativeVolumeSchema.optional(),
      oilPrice: nonNegativePriceSchema.optional(),
      gasPrice: nonNegativePriceSchema.optional(),
      runTicket: z.string().max(100).optional(),
      comments: z.string().max(1000).optional(),
    })
    .refine(
      (data) => {
        // Business rule: at least one volume must be provided
        return data.oilVolume || data.gasVolume || data.waterVolume;
      },
      {
        message:
          'At least one production volume (oil, gas, or water) must be provided',
        path: ['oilVolume'],
      },
    ),

  // Update production record schema (all fields optional)
  updateProductionRecord: z.object({
    oilVolume: nonNegativeVolumeSchema.optional(),
    gasVolume: nonNegativeVolumeSchema.optional(),
    waterVolume: nonNegativeVolumeSchema.optional(),
    oilPrice: nonNegativePriceSchema.optional(),
    gasPrice: nonNegativePriceSchema.optional(),
    runTicket: z.string().max(100).optional(),
    comments: z.string().max(1000).optional(),
  }),

  // Production record response schema
  productionRecordResponse: z.object({
    id: z
      .string()
      .refine(
        (val) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            val,
          ),
        'Invalid UUID',
      ),
    wellId: z
      .string()
      .refine(
        (val) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            val,
          ),
        'Invalid UUID',
      ),
    organizationId: z
      .string()
      .refine(
        (val) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            val,
          ),
        'Invalid UUID',
      ),
    productionDate: z.date(),
    oilVolume: z.number().nullable(),
    gasVolume: z.number().nullable(),
    waterVolume: z.number().nullable(),
    oilPrice: z.number().nullable(),
    gasPrice: z.number().nullable(),
    runTicket: z.string().nullable(),
    comments: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Production records by well query
  productionByWellQuery: z.object({
    wellId: z
      .string()
      .refine(
        (val) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            val,
          ),
        'Invalid well ID',
      ),
    startDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date format')
      .optional(),
    endDate: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date format')
      .optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
  }),

  // Bulk production insert schema
  bulkProductionInsert: z
    .array(
      z
        .object({
          wellId: z
            .string()
            .refine(
              (val) =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                  val,
                ),
              'Invalid well ID',
            ),
          productionDate: productionDateSchema,
          oilVolume: nonNegativeVolumeSchema.optional(),
          gasVolume: nonNegativeVolumeSchema.optional(),
          waterVolume: nonNegativeVolumeSchema.optional(),
          oilPrice: nonNegativePriceSchema.optional(),
          gasPrice: nonNegativePriceSchema.optional(),
          runTicket: z.string().max(100).optional(),
          comments: z.string().max(1000).optional(),
        })
        .refine(
          (data) => {
            // Business rule: at least one volume must be provided
            return data.oilVolume || data.gasVolume || data.waterVolume;
          },
          {
            message:
              'At least one production volume (oil, gas, or water) must be provided',
            path: ['oilVolume'],
          },
        ),
    )
    .min(1, 'At least one production record is required')
    .max(1000, 'Maximum 1000 records per bulk insert'),
};

// Export individual schemas for reuse
export {
  nonNegativeVolumeSchema,
  nonNegativePriceSchema,
  productionDateSchema,
};
