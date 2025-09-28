import { validate } from 'class-validator';
import { CreateAfeDto } from '../create-afe.dto';
import { AfeType } from '../../../domain/enums/afe-status.enum';

describe('CreateAfeDto', () => {
  it('should be defined', () => {
    expect(CreateAfeDto).toBeDefined();
  });

  describe('validation', () => {
    it('should validate successfully with all required fields', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.DRILLING;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with all fields', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.COMPLETION;
      dto.wellId = '123e4567-e89b-12d3-a456-426614174000';
      dto.leaseId = '123e4567-e89b-12d3-a456-426614174001';
      dto.totalEstimatedCost = 1500000.0;
      dto.description = 'Drilling and completion of Well ABC-123';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when afeNumber is missing', async () => {
      const dto = new CreateAfeDto();
      dto.afeType = AfeType.DRILLING;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isString');
    });

    it('should validate successfully when afeNumber is empty string', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = '';
      dto.afeType = AfeType.DRILLING;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when afeType is missing', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when afeType is invalid', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      (dto as any).afeType = 'invalid-type';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when wellId is not a valid UUID', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.DRILLING;
      dto.wellId = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isUuid');
    });

    it('should fail validation when leaseId is not a valid UUID', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.DRILLING;
      dto.leaseId = 'invalid-uuid';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isUuid');
    });

    it('should fail validation when totalEstimatedCost is negative', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.DRILLING;
      dto.totalEstimatedCost = -1000;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('min');
    });

    it('should fail validation when totalEstimatedCost is not a number', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.DRILLING;
      (dto as any).totalEstimatedCost = 'not-a-number';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isNumber');
    });

    it('should validate successfully with valid UUIDs', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.FACILITY;
      dto.wellId = '123e4567-e89b-12d3-a456-426614174000';
      dto.leaseId = '123e4567-e89b-12d3-a456-426614174001';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with valid cost', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.WORKOVER;
      dto.totalEstimatedCost = 2500000.5;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with description', async () => {
      const dto = new CreateAfeDto();
      dto.afeNumber = 'AFE-2024-0001';
      dto.afeType = AfeType.DRILLING;
      dto.description = 'Valid description for the AFE';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
