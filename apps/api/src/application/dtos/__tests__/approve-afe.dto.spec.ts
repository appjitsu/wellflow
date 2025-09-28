import { validate } from 'class-validator';
import { ApproveAfeDto } from '../approve-afe.dto';

describe('ApproveAfeDto', () => {
  it('should be defined', () => {
    expect(ApproveAfeDto).toBeDefined();
  });

  describe('validation', () => {
    it('should validate successfully with no fields', async () => {
      const dto = new ApproveAfeDto();

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with approvedAmount only', async () => {
      const dto = new ApproveAfeDto();
      dto.approvedAmount = 1400000.0;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with comments only', async () => {
      const dto = new ApproveAfeDto();
      dto.comments = 'Approved with reduced scope for Phase 1';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with all fields', async () => {
      const dto = new ApproveAfeDto();
      dto.approvedAmount = 1500000.5;
      dto.comments = 'Full approval granted';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when approvedAmount is negative', async () => {
      const dto = new ApproveAfeDto();
      dto.approvedAmount = -1000;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('min');
    });

    it('should fail validation when approvedAmount is not a number', async () => {
      const dto = new ApproveAfeDto();
      (dto as any).approvedAmount = 'not-a-number';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isNumber');
    });

    it('should validate successfully with zero approvedAmount', async () => {
      const dto = new ApproveAfeDto();
      dto.approvedAmount = 0;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with positive approvedAmount', async () => {
      const dto = new ApproveAfeDto();
      dto.approvedAmount = 2500000.75;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with empty comments', async () => {
      const dto = new ApproveAfeDto();
      dto.comments = '';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate successfully with long comments', async () => {
      const dto = new ApproveAfeDto();
      dto.comments = 'A'.repeat(1000);

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when comments is not a string', async () => {
      const dto = new ApproveAfeDto();
      (dto as any).comments = 123;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]?.constraints).toHaveProperty('isString');
    });
  });
});
