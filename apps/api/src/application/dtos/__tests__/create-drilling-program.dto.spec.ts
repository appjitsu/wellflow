import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateDrillingProgramDto } from '../create-drilling-program.dto';
import { DrillingProgramStatus } from '../../../domain/enums/drilling-program-status.enum';

describe('CreateDrillingProgramDto', () => {
  let dto: CreateDrillingProgramDto;

  beforeEach(() => {
    dto = plainToClass(CreateDrillingProgramDto, {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      wellId: '123e4567-e89b-12d3-a456-426614174001',
      afeId: '123e4567-e89b-12d3-a456-426614174002',
      programName: 'Drilling Program Alpha',
      status: DrillingProgramStatus.DRAFT,
      program: {
        objectives: 'Drill to 10000 ft',
        phases: ['Phase 1', 'Phase 2'],
      },
      hazards: { h2s: 'Low risk', blowout: 'Medium risk' },
      approvals: [{ approver: 'John Doe', status: 'pending' }],
      version: 1,
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimum required fields', async () => {
      const minimalDto = plainToClass(CreateDrillingProgramDto, {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        wellId: '123e4567-e89b-12d3-a456-426614174001',
        programName: 'Minimal Program',
      });

      const errors = await validate(minimalDto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid organizationId UUID', async () => {
      dto.organizationId = 'invalid-uuid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const orgError = errors.find(
        (error) => error.property === 'organizationId',
      );
      expect(orgError).toBeDefined();
    });

    it('should fail validation with missing organizationId', async () => {
      delete (dto as any).organizationId;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const orgError = errors.find(
        (error) => error.property === 'organizationId',
      );
      expect(orgError).toBeDefined();
    });

    it('should fail validation with invalid wellId UUID', async () => {
      dto.wellId = 'not-uuid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const wellError = errors.find((error) => error.property === 'wellId');
      expect(wellError).toBeDefined();
    });

    it('should fail validation with invalid afeId UUID', async () => {
      dto.afeId = 'invalid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const afeError = errors.find((error) => error.property === 'afeId');
      expect(afeError).toBeDefined();
    });

    it('should fail validation with missing programName', async () => {
      delete (dto as any).programName;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(
        (error) => error.property === 'programName',
      );
      expect(nameError).toBeDefined();
    });

    it('should fail validation with empty programName', async () => {
      dto.programName = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(
        (error) => error.property === 'programName',
      );
      expect(nameError).toBeDefined();
    });

    it('should fail validation with invalid status enum', async () => {
      (dto as any).status = 'invalid-status';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const statusError = errors.find((error) => error.property === 'status');
      expect(statusError).toBeDefined();
    });

    it('should fail validation with invalid version type', async () => {
      (dto as any).version = 'one';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const versionError = errors.find((error) => error.property === 'version');
      expect(versionError).toBeDefined();
    });

    it('should fail validation with version less than 1', async () => {
      dto.version = 0;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const versionError = errors.find((error) => error.property === 'version');
      expect(versionError).toBeDefined();
    });

    it('should pass validation with valid version', async () => {
      dto.version = 5;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept all valid statuses', async () => {
      const validStatuses = [
        DrillingProgramStatus.DRAFT,
        DrillingProgramStatus.APPROVED,
        DrillingProgramStatus.IN_PROGRESS,
        DrillingProgramStatus.COMPLETED,
        DrillingProgramStatus.CANCELLED,
      ];

      for (const status of validStatuses) {
        dto.status = status;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('data transformation', () => {
    it('should preserve all provided data', () => {
      expect(dto.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.wellId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(dto.afeId).toBe('123e4567-e89b-12d3-a456-426614174002');
      expect(dto.programName).toBe('Drilling Program Alpha');
      expect(dto.status).toBe(DrillingProgramStatus.DRAFT);
      expect(dto.program).toEqual({
        objectives: 'Drill to 10000 ft',
        phases: ['Phase 1', 'Phase 2'],
      });
      expect(dto.hazards).toEqual({ h2s: 'Low risk', blowout: 'Medium risk' });
      expect(dto.approvals).toEqual([
        { approver: 'John Doe', status: 'pending' },
      ]);
      expect(dto.version).toBe(1);
    });

    it('should handle undefined optional fields', () => {
      const minimalDto = plainToClass(CreateDrillingProgramDto, {
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        wellId: '123e4567-e89b-12d3-a456-426614174001',
        programName: 'Minimal Program',
      });

      expect(minimalDto.afeId).toBeUndefined();
      expect(minimalDto.status).toBeUndefined();
      expect(minimalDto.program).toBeUndefined();
      expect(minimalDto.hazards).toBeUndefined();
      expect(minimalDto.approvals).toBeUndefined();
      expect(minimalDto.version).toBeUndefined();
    });

    it('should work with class-transformer', () => {
      const plainObject = {
        organizationId: '456e7890-e89b-12d3-a456-426614174003',
        wellId: '456e7890-e89b-12d3-a456-426614174004',
        programName: 'Transformed Program',
        status: 'approved',
        version: 2,
      };

      const transformedDto = plainToClass(
        CreateDrillingProgramDto,
        plainObject,
      );
      expect(transformedDto).toBeInstanceOf(CreateDrillingProgramDto);
      expect(transformedDto.organizationId).toBe(
        '456e7890-e89b-12d3-a456-426614174003',
      );
      expect(transformedDto.status).toBe('approved');
      expect(transformedDto.version).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty objects for program, hazards, approvals', async () => {
      dto.program = {};
      dto.hazards = {};
      dto.approvals = [];
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle large version numbers', async () => {
      dto.version = 1000;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle long program names', async () => {
      dto.programName = 'A'.repeat(1000);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle complex nested objects', async () => {
      dto.program = {
        objectives: 'Complex drilling objectives',
        phases: [
          { name: 'Phase 1', duration: 30, cost: 500000 },
          { name: 'Phase 2', duration: 45, cost: 750000 },
        ],
        equipment: ['Rig A', 'Drill B'],
      };
      dto.hazards = {
        environmental: { risk: 'low' },
        operational: { risk: 'medium' },
      };
      dto.approvals = [
        { approver: 'Jane Smith', status: 'approved', date: '2024-01-01' },
        { approver: 'Bob Johnson', status: 'pending' },
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
