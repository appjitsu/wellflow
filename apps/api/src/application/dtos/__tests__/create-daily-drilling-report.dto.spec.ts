import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateDailyDrillingReportDto } from '../create-daily-drilling-report.dto';

describe('CreateDailyDrillingReportDto', () => {
  let dto: CreateDailyDrillingReportDto;

  beforeEach(() => {
    dto = plainToClass(CreateDailyDrillingReportDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      organizationId: '123e4567-e89b-12d3-a456-426614174001',
      wellId: '123e4567-e89b-12d3-a456-426614174002',
      reportDate: '2024-01-15',
      depthMd: 5000,
      depthTvd: 4800,
      rotatingHours: 12.5,
      nptHours: 2.0,
      dayCost: 15000,
      nextOperations: 'Continue drilling to 6000 ft',
      notes: 'Weather conditions good, no issues reported',
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimum required fields', async () => {
      const minimalDto = plainToClass(CreateDailyDrillingReportDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        wellId: '123e4567-e89b-12d3-a456-426614174002',
        reportDate: '2024-01-15',
      });

      const errors = await validate(minimalDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid id UUID', async () => {
      dto.id = 'invalid-uuid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
      expect(idError?.constraints).toHaveProperty('isUuid');
    });

    it('should fail validation with missing id', async () => {
      delete (dto as any).id;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const idError = errors.find((error) => error.property === 'id');
      expect(idError).toBeDefined();
    });

    it('should fail validation with invalid organizationId UUID', async () => {
      dto.organizationId = 'not-a-uuid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const orgError = errors.find(
        (error) => error.property === 'organizationId',
      );
      expect(orgError).toBeDefined();
    });

    it('should fail validation with invalid wellId UUID', async () => {
      dto.wellId = 'invalid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const wellError = errors.find((error) => error.property === 'wellId');
      expect(wellError).toBeDefined();
    });

    it('should fail validation with invalid reportDate format', async () => {
      dto.reportDate = '01-15-2024';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const dateError = errors.find((error) => error.property === 'reportDate');
      expect(dateError).toBeDefined();
    });

    it('should fail validation with non-date reportDate', async () => {
      dto.reportDate = 'not-a-date';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const dateError = errors.find((error) => error.property === 'reportDate');
      expect(dateError).toBeDefined();
    });

    it('should fail validation with invalid depthMd type', async () => {
      (dto as any).depthMd = 'not-a-number';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const depthError = errors.find((error) => error.property === 'depthMd');
      expect(depthError).toBeDefined();
    });

    it('should fail validation with invalid depthTvd type', async () => {
      (dto as any).depthTvd = 'invalid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const tvdError = errors.find((error) => error.property === 'depthTvd');
      expect(tvdError).toBeDefined();
    });

    it('should fail validation with invalid rotatingHours type', async () => {
      (dto as any).rotatingHours = 'twelve';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const rotError = errors.find(
        (error) => error.property === 'rotatingHours',
      );
      expect(rotError).toBeDefined();
    });

    it('should fail validation with invalid nptHours type', async () => {
      (dto as any).nptHours = 'two';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nptError = errors.find((error) => error.property === 'nptHours');
      expect(nptError).toBeDefined();
    });

    it('should fail validation with invalid dayCost type', async () => {
      (dto as any).dayCost = 'expensive';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const costError = errors.find((error) => error.property === 'dayCost');
      expect(costError).toBeDefined();
    });

    it('should fail validation with nextOperations too long', async () => {
      dto.nextOperations = 'A'.repeat(1001);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const opsError = errors.find(
        (error) => error.property === 'nextOperations',
      );
      expect(opsError).toBeDefined();
    });

    it('should fail validation with notes too long', async () => {
      dto.notes = 'B'.repeat(4001);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const notesError = errors.find((error) => error.property === 'notes');
      expect(notesError).toBeDefined();
    });

    it('should pass validation with nextOperations at max length', async () => {
      dto.nextOperations = 'C'.repeat(1000);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with notes at max length', async () => {
      dto.notes = 'D'.repeat(4000);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('data transformation', () => {
    it('should preserve all provided data', () => {
      expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.organizationId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(dto.wellId).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(dto.reportDate).toBe('2024-01-15');
      expect(dto.depthMd).toBe(5000);
      expect(dto.depthTvd).toBe(4800);
      expect(dto.rotatingHours).toBe(12.5);
      expect(dto.nptHours).toBe(2.0);
      expect(dto.dayCost).toBe(15000);
      expect(dto.nextOperations).toBe('Continue drilling to 6000 ft');
      expect(dto.notes).toBe('Weather conditions good, no issues reported');
    });

    it('should handle undefined optional fields', () => {
      const minimalDto = plainToClass(CreateDailyDrillingReportDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        wellId: '123e4567-e89b-12d3-a456-426614174002',
        reportDate: '2024-01-15',
      });

      expect(minimalDto.depthMd).toBeUndefined();
      expect(minimalDto.depthTvd).toBeUndefined();
      expect(minimalDto.rotatingHours).toBeUndefined();
      expect(minimalDto.nptHours).toBeUndefined();
      expect(minimalDto.dayCost).toBeUndefined();
      expect(minimalDto.nextOperations).toBeUndefined();
      expect(minimalDto.notes).toBeUndefined();
    });

    it('should work with class-transformer', () => {
      const plainObject = {
        id: '456e7890-e89b-12d3-a456-426614174003',
        organizationId: '456e7890-e89b-12d3-a456-426614174004',
        wellId: '456e7890-e89b-12d3-a456-426614174005',
        reportDate: '2024-02-01',
        depthMd: 6000,
        depthTvd: 5800,
        rotatingHours: 14.0,
        nptHours: 0,
        dayCost: 18000,
        nextOperations: 'Prepare for casing',
        notes: 'Successful day',
      };

      const transformedDto = plainToClass(
        CreateDailyDrillingReportDto,
        plainObject,
      );
      expect(transformedDto).toBeInstanceOf(CreateDailyDrillingReportDto);
      expect(transformedDto.id).toBe('456e7890-e89b-12d3-a456-426614174003');
      expect(transformedDto.reportDate).toBe('2024-02-01');
      expect(transformedDto.depthMd).toBe(6000);
    });
  });

  describe('edge cases', () => {
    it('should handle zero values for numeric fields', async () => {
      dto.depthMd = 0;
      dto.depthTvd = 0;
      dto.rotatingHours = 0;
      dto.nptHours = 0;
      dto.dayCost = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle negative values for numeric fields', async () => {
      dto.depthMd = -100;
      dto.depthTvd = -50;
      dto.rotatingHours = -1;
      dto.nptHours = -0.5;
      dto.dayCost = -5000;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // Validators don't prevent negative numbers
    });

    it('should handle very large numbers', async () => {
      dto.depthMd = 50000;
      dto.depthTvd = 49000;
      dto.rotatingHours = 100;
      dto.nptHours = 50;
      dto.dayCost = 1000000;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle decimal values', async () => {
      dto.rotatingHours = 12.345;
      dto.nptHours = 2.678;
      dto.dayCost = 15000.99;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle empty strings for optional text fields', async () => {
      dto.nextOperations = '';
      dto.notes = '';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle very long valid strings', async () => {
      dto.nextOperations = 'A'.repeat(500);
      dto.notes = 'B'.repeat(2000);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle future dates', async () => {
      dto.reportDate = '2030-12-31';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle past dates', async () => {
      dto.reportDate = '2000-01-01';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
