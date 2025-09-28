import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateWorkoverDto } from '../create-workover.dto';

describe('CreateWorkoverDto', () => {
  let dto: CreateWorkoverDto;

  beforeEach(() => {
    dto = plainToClass(CreateWorkoverDto, {
      organizationId: '123e4567-e89b-12d3-a456-426614174000',
      wellId: '123e4567-e89b-12d3-a456-426614174001',
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid organizationId UUID', async () => {
      dto.organizationId = 'invalid-uuid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation with invalid wellId UUID', async () => {
      dto.wellId = 'invalid-uuid';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('data transformation', () => {
    it('should preserve all provided data', () => {
      expect(dto.organizationId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.wellId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should work with class-transformer', () => {
      const transformedDto = plainToClass(CreateWorkoverDto, {
        organizationId: '456e7890-e89b-12d3-a456-426614174002',
        wellId: '456e7890-e89b-12d3-a456-426614174003',
      });
      expect(transformedDto).toBeInstanceOf(CreateWorkoverDto);
    });
  });
});
