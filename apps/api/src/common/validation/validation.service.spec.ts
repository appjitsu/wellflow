import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  describe('validate', () => {
    it('should validate and return data when schema passes', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 30 };
      const result = service.validate(schema, data);

      expect(result).toEqual(data);
    });

    it('should throw BadRequestException when validation fails', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 'invalid' };

      expect(() => service.validate(schema, data)).toThrow(BadRequestException);
    });

    it('should include validation error details in exception', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      const data = { email: 'invalid-email', age: 15 };

      try {
        service.validate(schema, data);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect((error as BadRequestException).getResponse()).toMatchObject({
          message: 'Validation failed',
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: expect.any(String),
              code: expect.any(String),
            }),
            expect.objectContaining({
              field: 'age',
              message: expect.any(String),
              code: expect.any(String),
            }),
          ]),
        });
      }
    });

    it('should handle nested object validation', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
          }),
        }),
      });

      const data = { user: { profile: { name: 'John' } } };
      const result = service.validate(schema, data);

      expect(result).toEqual(data);
    });

    it('should handle array validation', () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      const data = { tags: ['tag1', 'tag2', 'tag3'] };
      const result = service.validate(schema, data);

      expect(result).toEqual(data);
    });

    it('should re-throw non-ZodError errors', () => {
      const schema = z.object({
        name: z.string(),
      });

      // Mock schema.parse to throw a non-ZodError
      jest.spyOn(schema, 'parse').mockImplementation(() => {
        throw new Error('Custom error');
      });

      expect(() => service.validate(schema, {})).toThrow('Custom error');
    });
  });

  describe('validateSafe', () => {
    it('should return success result when validation passes', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 30 };
      const result = service.validateSafe(schema, data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should return error result when validation fails', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const data = { name: 'John', age: 'invalid' };
      const result = service.validateSafe(schema, data);

      expect(result).toMatchObject({
        success: false,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'age',
            message: expect.any(String),
            code: expect.any(String),
          }),
        ]),
      });
    });

    it('should handle multiple validation errors', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
        name: z.string().min(2),
      });

      const data = { email: 'invalid', age: 15, name: 'A' };
      const result = service.validateSafe(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(3);
        expect(result.errors.map((e) => e.field)).toEqual(
          expect.arrayContaining(['email', 'age', 'name']),
        );
      }
    });

    it('should handle nested field errors', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(2),
          }),
        }),
      });

      const data = { user: { profile: { name: 'A' } } };
      const result = service.validateSafe(schema, data);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors?.[0]?.field).toBe('user.profile.name');
      }
    });
  });

  describe('schemas', () => {
    describe('id schema', () => {
      it('should validate valid UUID', () => {
        const validUuid = '123e4567-e89b-12d3-a456-426614174000';
        const result = service.validateSafe(service.schemas.id, validUuid);

        expect(result.success).toBe(true);
      });

      it('should reject invalid UUID', () => {
        const invalidUuid = 'not-a-uuid';
        const result = service.validateSafe(service.schemas.id, invalidUuid);

        expect(result.success).toBe(false);
      });
    });

    describe('email schema', () => {
      it('should validate valid email', () => {
        const validEmail = 'test@example.com';
        const result = service.validateSafe(service.schemas.email, validEmail);

        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidEmail = 'not-an-email';
        const result = service.validateSafe(
          service.schemas.email,
          invalidEmail,
        );

        expect(result.success).toBe(false);
      });
    });

    describe('pagination schema', () => {
      it('should validate valid pagination data', () => {
        const data = {
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc' as const,
        };
        const result = service.validateSafe(service.schemas.pagination, data);

        expect(result.success).toBe(true);
      });

      it('should apply default values', () => {
        const data = {};
        const result = service.validateSafe(service.schemas.pagination, data);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toMatchObject({
            page: 1,
            limit: 10,
            sortOrder: 'asc',
          });
        }
      });

      it('should reject invalid pagination values', () => {
        const data = { page: 0, limit: 101 };
        const result = service.validateSafe(service.schemas.pagination, data);

        expect(result.success).toBe(false);
      });
    });

    describe('dateRange schema', () => {
      it('should validate valid date range', () => {
        const data = {
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-12-31T23:59:59Z',
        };
        const result = service.validateSafe(service.schemas.dateRange, data);

        expect(result.success).toBe(true);
      });

      it('should reject invalid date range (start after end)', () => {
        const data = {
          startDate: '2023-12-31T23:59:59Z',
          endDate: '2023-01-01T00:00:00Z',
        };
        const result = service.validateSafe(service.schemas.dateRange, data);

        expect(result.success).toBe(false);
      });

      it('should allow empty date range', () => {
        const data = {};
        const result = service.validateSafe(service.schemas.dateRange, data);

        expect(result.success).toBe(true);
      });

      it('should allow partial date range', () => {
        const data = { startDate: '2023-01-01T00:00:00Z' };
        const result = service.validateSafe(service.schemas.dateRange, data);

        expect(result.success).toBe(true);
      });
    });

    describe('organizationId schema', () => {
      it('should validate valid organization ID', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174000';
        const result = service.validateSafe(
          service.schemas.organizationId,
          validId,
        );

        expect(result.success).toBe(true);
      });

      it('should reject invalid organization ID', () => {
        const invalidId = 'not-a-uuid';
        const result = service.validateSafe(
          service.schemas.organizationId,
          invalidId,
        );

        expect(result.success).toBe(false);
      });
    });

    describe('userId schema', () => {
      it('should validate valid user ID', () => {
        const validId = '123e4567-e89b-12d3-a456-426614174000';
        const result = service.validateSafe(service.schemas.userId, validId);

        expect(result.success).toBe(true);
      });

      it('should reject invalid user ID', () => {
        const invalidId = 'not-a-uuid';
        const result = service.validateSafe(service.schemas.userId, invalidId);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('service instantiation', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should be an instance of ValidationService', () => {
      expect(service).toBeInstanceOf(ValidationService);
    });

    it('should have all required methods', () => {
      expect(typeof service.validate).toBe('function');
      expect(typeof service.validateSafe).toBe('function');
    });

    it('should have schemas property', () => {
      expect(service.schemas).toBeDefined();
      expect(typeof service.schemas).toBe('object');
    });

    it('should have all expected schemas', () => {
      expect(service.schemas.id).toBeDefined();
      expect(service.schemas.email).toBeDefined();
      expect(service.schemas.pagination).toBeDefined();
      expect(service.schemas.dateRange).toBeDefined();
      expect(service.schemas.organizationId).toBeDefined();
      expect(service.schemas.userId).toBeDefined();
    });
  });
});
