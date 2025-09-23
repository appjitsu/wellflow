import { z } from 'zod';

/**
 * API Number validation schema
 * Validates 14-digit API numbers with proper format
 */
const apiNumberSchema = z
  .string()
  .length(14, 'API number must be exactly 14 digits')
  .regex(/^\d{14}$/, 'API number must contain only digits')
  .refine(
    (value) => {
      // Additional business rule validation for API numbers
      // First 2 digits: State code (01-99)
      const stateCode = parseInt(value.substring(0, 2));
      if (stateCode < 1 || stateCode > 99) {
        return false;
      }

      // Next 3 digits: County code (001-999)
      const countyCode = parseInt(value.substring(2, 5));
      if (countyCode < 1 || countyCode > 999) {
        return false;
      }

      return true;
    },
    {
      message:
        'Invalid API number format: state code must be 01-99, county code must be 001-999',
    },
  );

/**
 * Well type enum validation
 */
const wellTypeSchema = z.enum(
  ['OIL', 'GAS', 'OIL_AND_GAS', 'INJECTION', 'DISPOSAL', 'WATER', 'OTHER'],
  {
    message:
      'Well type must be one of: OIL, GAS, OIL_AND_GAS, INJECTION, DISPOSAL, WATER, OTHER',
  },
);

/**
 * Well status enum validation
 */
const wellStatusSchema = z.enum(['active', 'inactive', 'plugged', 'drilling'], {
  message: 'Well status must be one of: active, inactive, plugged, drilling',
});

/**
 * Positive decimal validation for depths and coordinates
 */
const positiveDecimalSchema = z
  .number()
  .nonnegative('Value must be non-negative')
  .finite('Value must be a finite number');

/**
 * Coordinate validation schemas
 */
const latitudeSchema = z
  .number()
  .min(-90, 'Latitude must be between -90 and 90 degrees')
  .max(90, 'Latitude must be between -90 and 90 degrees')
  .finite('Latitude must be a finite number');

const longitudeSchema = z
  .number()
  .min(-180, 'Longitude must be between -180 and 180 degrees')
  .max(180, 'Longitude must be between -180 and 180 degrees')
  .finite('Longitude must be a finite number');

/**
 * Well-related Zod schemas for validation
 */
export const wellSchemas = {
  // Create well schema
  createWell: z
    .object({
      apiNumber: apiNumberSchema,
      wellName: z.string().min(1, 'Well name is required').max(255),
      wellNumber: z.string().max(50).optional(),
      wellType: wellTypeSchema,
      status: wellStatusSchema.default('active'),
      leaseId: z.string().uuid('Invalid lease ID').optional(),
      spudDate: z.string().datetime().optional(),
      completionDate: z.string().datetime().optional(),
      totalDepth: positiveDecimalSchema.optional(),
      latitude: latitudeSchema.optional(),
      longitude: longitudeSchema.optional(),
      operator: z.string().max(255).optional(),
      field: z.string().max(255).optional(),
      formation: z.string().max(255).optional(),
    })
    .refine(
      (data) => {
        // Business rule: completion date must be after spud date
        return (
          !data.spudDate ||
          !data.completionDate ||
          new Date(data.completionDate) >= new Date(data.spudDate)
        );
      },
      {
        message: 'Completion date must be after spud date',
        path: ['completionDate'],
      },
    )
    .refine(
      (data) => {
        // Business rule: both latitude and longitude must be provided together
        return !(
          (data.latitude && !data.longitude) ||
          (!data.latitude && data.longitude)
        );
      },
      {
        message: 'Both latitude and longitude must be provided together',
        path: ['latitude'],
      },
    ),

  // Update well schema (all fields optional except business rules still apply)
  updateWell: z
    .object({
      wellName: z.string().min(1).max(255).optional(),
      wellNumber: z.string().max(50).optional(),
      wellType: wellTypeSchema.optional(),
      status: wellStatusSchema.optional(),
      leaseId: z.string().uuid('Invalid lease ID').optional(),
      spudDate: z.string().datetime().optional(),
      completionDate: z.string().datetime().optional(),
      totalDepth: positiveDecimalSchema.optional(),
      latitude: latitudeSchema.optional(),
      longitude: longitudeSchema.optional(),
      operator: z.string().max(255).optional(),
      field: z.string().max(255).optional(),
      formation: z.string().max(255).optional(),
    })
    .refine(
      (data) => {
        // Business rule: completion date must be after spud date
        return (
          !data.spudDate ||
          !data.completionDate ||
          new Date(data.completionDate) >= new Date(data.spudDate)
        );
      },
      {
        message: 'Completion date must be after spud date',
        path: ['completionDate'],
      },
    )
    .refine(
      (data) => {
        // Business rule: both latitude and longitude must be provided together
        return !(
          (data.latitude && !data.longitude) ||
          (!data.latitude && data.longitude)
        );
      },
      {
        message: 'Both latitude and longitude must be provided together',
        path: ['latitude'],
      },
    ),

  // Well response schema
  wellResponse: z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
    leaseId: z.string().uuid().nullable(),
    apiNumber: z.string(),
    wellName: z.string(),
    wellNumber: z.string().nullable(),
    wellType: wellTypeSchema,
    status: wellStatusSchema,
    spudDate: z.date().nullable(),
    completionDate: z.date().nullable(),
    totalDepth: z.number().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    operator: z.string().nullable(),
    field: z.string().nullable(),
    formation: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),

  // Well query parameters
  wellQuery: z.object({
    wellType: wellTypeSchema.optional(),
    status: wellStatusSchema.optional(),
    leaseId: z.string().uuid().optional(),
    field: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z
      .enum(['wellName', 'apiNumber', 'status', 'createdAt'])
      .default('wellName'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  // API number lookup schema
  apiNumberLookup: z.object({
    apiNumber: apiNumberSchema,
  }),

  // Well status update schema
  updateWellStatus: z.object({
    status: wellStatusSchema,
    reason: z.string().max(500).optional(),
  }),
};

// Export individual schemas for reuse
export { apiNumberSchema, wellTypeSchema, wellStatusSchema };
