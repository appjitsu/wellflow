import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateAfeCostDto } from '../update-afe-cost.dto';

describe('UpdateAfeCostDto', () => {
  let dto: UpdateAfeCostDto;

  beforeEach(() => {
    dto = plainToClass(UpdateAfeCostDto, {});
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with estimatedCost', async () => {
      dto.estimatedCost = 100000;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with actualCost', async () => {
      dto.actualCost = 95000;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with negative estimatedCost', async () => {
      dto.estimatedCost = -1000;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with negative actualCost', async () => {
      dto.actualCost = -500;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('data transformation', () => {
    it('should preserve all provided data', () => {
      dto.estimatedCost = 200000;
      dto.actualCost = 180000;
      expect(dto.estimatedCost).toBe(200000);
      expect(dto.actualCost).toBe(180000);
    });

    it('should work with class-transformer', () => {
      const transformedDto = plainToClass(UpdateAfeCostDto, {
        estimatedCost: 150000,
        actualCost: 140000,
      });
      expect(transformedDto).toBeInstanceOf(UpdateAfeCostDto);
      expect(transformedDto.estimatedCost).toBe(150000);
    });
  });
});
