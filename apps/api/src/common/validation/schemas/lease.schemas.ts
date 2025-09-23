import { z } from 'zod';

/**
 * Percentage validation schema (0-100% as decimal 0-1)
 */
const percentageSchema = z
  .number()
  .min(0, 'Percentage must be between 0 and 1 (0% to 100%)')
  .max(1, 'Percentage must be between 0 and 1 (0% to 100%)')
  .refine((val) => Number.isFinite(val), 'Percentage must be a finite number');

/**
 * Positive acreage validation schema
 */
const positiveAcreageSchema = z
  .number()
  .positive('Acreage must be positive')
  .refine((val) => Number.isFinite(val), 'Acreage must be a finite number');

/**
 * Date validation schema
 */
const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), 'Invalid date format');

/**
 * Lease-related Zod schemas for validation
 */
export const leaseSchemas = {
  // Create lease schema
  createLease: z
    .object({
      name: z.string().min(1, 'Name is required').max(255),
      leaseNumber: z.string().max(100).optional(),
      lessor: z.string().min(1, 'Lessor is required').max(255),
      lessee: z.string().min(1, 'Lessee is required').max(255),
      acreage: positiveAcreageSchema.optional(),
      royaltyRate: percentageSchema.optional(),
      effectiveDate: dateSchema.optional(),
      expirationDate: dateSchema.optional(),
      legalDescription: z.string().max(2000).optional(),
    })
    .refine(
      (data) => {
        // Business rule: expiration date must be after effective date
        if (data.effectiveDate && data.expirationDate) {
          return new Date(data.expirationDate) >= new Date(data.effectiveDate);
        }
        return true;
      },
      {
        message: 'Expiration date must be after effective date',
        path: ['expirationDate'],
      },
    ),

  // Update lease schema (all fields optional)
  updateLease: z
    .object({
      name: z.string().min(1).max(255).optional(),
      leaseNumber: z.string().max(100).optional(),
      lessor: z.string().min(1).max(255).optional(),
      lessee: z.string().min(1).max(255).optional(),
      acreage: positiveAcreageSchema.optional(),
      royaltyRate: percentageSchema.optional(),
      effectiveDate: dateSchema.optional(),
      expirationDate: dateSchema.optional(),
      status: z.enum(['active', 'expired', 'terminated']).optional(),
      legalDescription: z.string().max(2000).optional(),
    })
    .refine(
      (data) => {
        // Business rule: expiration date must be after effective date
        if (data.effectiveDate && data.expirationDate) {
          return new Date(data.expirationDate) >= new Date(data.effectiveDate);
        }
        return true;
      },
      {
        message: 'Expiration date must be after effective date',
        path: ['expirationDate'],
      },
    ),

  // Lease response schema
  leaseResponse: z.object({
    id: z
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
    name: z.string(),
    leaseNumber: z.string().nullable(),
    lessor: z.string(),
    lessee: z.string(),
    acreage: z.number().nullable(),
    royaltyRate: z.number().nullable(),
    effectiveDate: z.date().nullable(),
    expirationDate: z.date().nullable(),
    status: z.string(),
    legalDescription: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Lease query parameters
  leaseQuery: z.object({
    status: z.enum(['active', 'expired', 'terminated']).optional(),
    lessor: z.string().optional(),
    lessee: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z
      .enum(['name', 'leaseNumber', 'status', 'createdAt'])
      .default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  // Lease partner validation schemas
  createLeasePartner: z
    .object({
      leaseId: z
        .string()
        .refine(
          (val) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              val,
            ),
          'Invalid lease ID',
        ),
      partnerId: z
        .string()
        .refine(
          (val) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              val,
            ),
          'Invalid partner ID',
        ),
      workingInterestPercent: percentageSchema,
      royaltyInterestPercent: percentageSchema,
      netRevenueInterestPercent: percentageSchema,
      effectiveDate: dateSchema,
      endDate: dateSchema.optional(),
      isOperator: z.boolean().default(false),
    })
    .refine(
      (data) => {
        // Business rule: end date must be after effective date
        if (data.endDate) {
          return new Date(data.endDate) >= new Date(data.effectiveDate);
        }
        return true;
      },
      {
        message: 'End date must be after effective date',
        path: ['endDate'],
      },
    ),

  updateLeasePartner: z
    .object({
      workingInterestPercent: percentageSchema.optional(),
      royaltyInterestPercent: percentageSchema.optional(),
      netRevenueInterestPercent: percentageSchema.optional(),
      effectiveDate: dateSchema.optional(),
      endDate: dateSchema.optional(),
      isOperator: z.boolean().optional(),
    })
    .refine(
      (data) => {
        // Business rule: end date must be after effective date
        if (data.effectiveDate && data.endDate) {
          return new Date(data.endDate) >= new Date(data.effectiveDate);
        }
        return true;
      },
      {
        message: 'End date must be after effective date',
        path: ['endDate'],
      },
    ),
};

// Export individual schemas for reuse
export { percentageSchema, positiveAcreageSchema, dateSchema };
