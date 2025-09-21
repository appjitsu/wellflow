import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateWellStatusDto } from './update-well-status.dto';
import { WellStatus } from '../../domain/enums/well-status.enum';

describe('UpdateWellStatusDto', () => {
  let dto: UpdateWellStatusDto;

  beforeEach(() => {
    dto = new UpdateWellStatusDto();
    dto.status = WellStatus.DRILLING;
    dto.reason = 'Starting drilling operations';
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional reason', async () => {
      delete dto.reason;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid status', async () => {
      // Use type assertion to test invalid values
      (dto as unknown as { status: string }).status = 'invalid-status';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const statusError = errors.find((error) => error.property === 'status');
      expect(statusError).toBeDefined();
    });

    it('should fail validation with missing status', async () => {
      delete (dto as unknown as { status?: string }).status;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const statusError = errors.find((error) => error.property === 'status');
      expect(statusError).toBeDefined();
    });

    it('should accept all valid well statuses', async () => {
      const validStatuses = [
        WellStatus.PLANNED,
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        WellStatus.PRODUCING,
        WellStatus.SHUT_IN,
        WellStatus.PLUGGED,
      ];

      for (const status of validStatuses) {
        dto.status = status;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should validate reason as string when provided', async () => {
      // Use type assertion to test invalid values
      (dto as unknown as { reason: number }).reason = 123; // Invalid type
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const reasonError = errors.find((error) => error.property === 'reason');
      expect(reasonError).toBeDefined();
    });
  });

  describe('data transformation', () => {
    it('should preserve all provided data', () => {
      expect(dto.status).toBe(WellStatus.DRILLING);
      expect(dto.reason).toBe('Starting drilling operations');
    });

    it('should handle undefined reason', () => {
      const dtoWithoutReason = new UpdateWellStatusDto();
      dtoWithoutReason.status = WellStatus.COMPLETED;

      expect(dtoWithoutReason.status).toBe(WellStatus.COMPLETED);
      expect(dtoWithoutReason.reason).toBeUndefined();
    });

    it('should work with class-transformer', () => {
      const plainObject = {
        status: 'producing',
        reason: 'Well is now producing oil',
      };

      const transformedDto = plainToClass(UpdateWellStatusDto, plainObject);
      expect(transformedDto).toBeInstanceOf(UpdateWellStatusDto);
      expect(transformedDto.status).toBe('producing');
      expect(transformedDto.reason).toBe('Well is now producing oil');
    });

    it('should handle empty string reason', () => {
      dto.reason = '';
      expect(dto.reason).toBe('');
    });
  });

  describe('status transitions', () => {
    it('should handle common status transitions', async () => {
      const transitions = [
        { status: WellStatus.PLANNED, reason: 'Well planning completed' },
        { status: WellStatus.DRILLING, reason: 'Drilling commenced' },
        { status: WellStatus.COMPLETED, reason: 'Drilling completed' },
        { status: WellStatus.PRODUCING, reason: 'Production started' },
        { status: WellStatus.SHUT_IN, reason: 'Temporary shutdown' },
        { status: WellStatus.PLUGGED, reason: 'End of life' },
      ];

      for (const transition of transitions) {
        dto.status = transition.status;
        dto.reason = transition.reason;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle emergency status changes', async () => {
      dto.status = WellStatus.SHUT_IN;
      dto.reason = 'EMERGENCY: Equipment failure detected';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle regulatory status changes', async () => {
      dto.status = WellStatus.PLUGGED;
      dto.reason = 'Regulatory compliance - well abandonment required';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very long reason text', async () => {
      dto.reason = 'A'.repeat(10000); // Very long reason
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle special characters in reason', async () => {
      dto.reason =
        'Status change due to: weather conditions (high winds > 50mph) & equipment issues!';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle unicode characters in reason', async () => {
      dto.reason = 'Cambio de estado: condiciones climáticas adversas 🌪️';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle multiline reason text', async () => {
      dto.reason =
        'Line 1: Equipment failure\nLine 2: Safety concerns\nLine 3: Immediate shutdown required';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle null reason', async () => {
      // Use type assertion to test null values
      (dto as unknown as { reason: null }).reason = null;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // Should pass because reason is optional
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const json = JSON.stringify(dto);
      const parsed = JSON.parse(json) as { status: string; reason: string };

      expect(parsed.status).toBe(WellStatus.DRILLING);
      expect(parsed.reason).toBe('Starting drilling operations');
    });

    it('should deserialize from JSON correctly', () => {
      const json =
        '{"status":"completed","reason":"Drilling finished successfully"}';
      const parsed = JSON.parse(json) as { status: string; reason: string };
      const newDto = plainToClass(UpdateWellStatusDto, parsed);

      expect(newDto.status).toBe('completed');
      expect(newDto.reason).toBe('Drilling finished successfully');
    });

    it('should handle partial JSON data', () => {
      const json = '{"status":"shut_in"}';
      const parsed = JSON.parse(json) as { status: string; reason?: string };
      const newDto = plainToClass(UpdateWellStatusDto, parsed);

      expect(newDto.status).toBe('shut_in');
      expect(newDto.reason).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const originalStatus = dto.status;
      const originalReason = dto.reason;

      expect(dto.status).toBe(originalStatus);
      expect(dto.reason).toBe(originalReason);

      // Multiple accesses should return same values
      expect(dto.status).toBe(dto.status);
      expect(dto.reason).toBe(dto.reason);
    });
  });

  describe('type checking', () => {
    it('should have correct property types', () => {
      expect(typeof dto.status).toBe('string');
      expect(typeof dto.reason).toBe('string');
    });

    it('should be instance of UpdateWellStatusDto', () => {
      expect(dto).toBeInstanceOf(UpdateWellStatusDto);
    });
  });
});
