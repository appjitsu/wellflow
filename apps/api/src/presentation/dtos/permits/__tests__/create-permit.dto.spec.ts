import { validate } from 'class-validator';
import { CreatePermitDto } from '../create-permit.dto';
import { PermitType } from '../../../../domain/value-objects/permit-type.vo';

describe('CreatePermitDto', () => {
  it('should be defined', () => {
    expect(CreatePermitDto).toBeDefined();
  });

  describe('validation', () => {
    it('should validate a valid DTO', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';
      dto.issuingAgency = 'EPA';
      dto.regulatoryAuthority = 'State Authority';
      dto.wellId = '550e8400-e29b-41d4-a716-446655440000';
      dto.facilityId = '550e8400-e29b-41d4-a716-446655440001';
      dto.location = { latitude: 31.9686, longitude: -99.9018 };
      dto.applicationDate = '2024-01-01';
      dto.expirationDate = '2025-01-01';
      dto.permitConditions = { condition: 'test' };
      dto.complianceRequirements = { requirement: 'test' };
      dto.feeAmount = 1000;
      dto.bondAmount = 5000;
      dto.bondType = 'surety';
      dto.documentIds = [
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ];

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should require permitType', async () => {
      const dto = new CreatePermitDto();
      dto.issuingAgency = 'EPA';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('permitType');
    });

    it('should require issuingAgency', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('issuingAgency');
    });

    it('should validate permitType enum', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'invalid';
      dto.issuingAgency = 'EPA';

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'permitType')).toBe(true);
    });

    it('should validate issuingAgency length', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';
      dto.issuingAgency = 'A'; // too short

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'issuingAgency')).toBe(true);
    });

    it('should validate wellId as UUID', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';
      dto.issuingAgency = 'EPA';
      dto.wellId = 'not-a-uuid';

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'wellId')).toBe(true);
    });

    it('should validate documentIds as array of UUIDs', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';
      dto.issuingAgency = 'EPA';
      dto.documentIds = ['not-a-uuid'];

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'documentIds')).toBe(true);
    });

    it('should validate feeAmount minimum', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';
      dto.issuingAgency = 'EPA';
      dto.feeAmount = -1;

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'feeAmount')).toBe(true);
    });

    it('should validate date strings', async () => {
      const dto = new CreatePermitDto();
      dto.permitType = 'drilling';
      dto.issuingAgency = 'EPA';
      dto.applicationDate = 'not-a-date';

      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'applicationDate')).toBe(true);
    });
  });
});
