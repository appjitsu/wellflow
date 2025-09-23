import { Injectable, BadRequestException } from '@nestjs/common';
import { z, ZodError } from 'zod';

@Injectable()
export class ValidationService {
  /**
   * Validates data against a Zod schema
   * @param schema - The Zod schema to validate against
   * @param data - The data to validate
   * @returns The validated and parsed data
   * @throws BadRequestException if validation fails
   */
  validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new BadRequestException({
          message: 'Validation failed',
          errors: errorMessages,
        });
      }
      throw error;
    }
  }

  /**
   * Validates data against a schema without throwing - returns validation result
   * @param schema - The Zod schema to validate against
   * @param data - The data to validate
   * @returns Object with success boolean and either data or errors
   */
  validateSafe<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
  ):
    | {
        success: true;
        data: T;
      }
    | {
        success: false;
        errors: Array<{ field: string; message: string; code: string }>;
      } {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));

      return { success: false, errors };
    }
  }

  /**
   * Common validation schemas for reuse across modules
   */
  readonly schemas = {
    id: z.string().uuid('Invalid UUID format'),

    email: z.string().email('Invalid email format'),

    pagination: z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(10),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
    }),

    dateRange: z
      .object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      })
      .refine(
        (data) => {
          if (data.startDate && data.endDate) {
            return new Date(data.startDate) <= new Date(data.endDate);
          }
          return true;
        },
        {
          message: 'Start date must be before or equal to end date',
          path: ['startDate'],
        },
      ),

    organizationId: z.string().uuid('Invalid organization ID'),

    userId: z.string().uuid('Invalid user ID'),
  };
}
