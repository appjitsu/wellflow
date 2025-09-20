import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateWellDto } from './create-well.dto';
import { WellType } from '../../domain/enums/well-status.enum';

describe('CreateWellDto', () => {
  let dto: CreateWellDto;

  beforeEach(() => {
    dto = plainToClass(CreateWellDto, {
      name: 'Test Well #1',
      apiNumber: '4212345678',
      operatorId: 'operator-123',
      wellType: WellType.OIL,
      totalDepth: 5000,
      spudDate: '2024-01-15',
      location: {
        latitude: 32.7767,
        longitude: -96.7970,
        address: '123 Main St',
        county: 'Dallas',
        state: 'TX',
        country: 'USA',
      },
    });
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty name', async () => {
      dto.name = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find(error => error.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('should fail validation with empty API number', async () => {
      dto.apiNumber = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const apiNumberError = errors.find(error => error.property === 'apiNumber');
      expect(apiNumberError).toBeDefined();
    });

    it('should fail validation with empty operator ID', async () => {
      dto.operatorId = '';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const operatorIdError = errors.find(error => error.property === 'operatorId');
      expect(operatorIdError).toBeDefined();
    });

    it('should fail validation with invalid well type', async () => {
      dto.wellType = 'invalid' as any;
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const wellTypeError = errors.find(error => error.property === 'wellType');
      expect(wellTypeError).toBeDefined();
    });

    it('should fail validation with invalid coordinates', async () => {
      dto.location.latitude = 200; // Invalid latitude
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const locationError = errors.find(error => error.property === 'location');
      expect(locationError).toBeDefined();
    });

    it('should fail validation with invalid longitude', async () => {
      dto.location.longitude = 200; // Invalid longitude
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const locationError = errors.find(error => error.property === 'location');
      expect(locationError).toBeDefined();
    });

    it('should fail validation with invalid spud date format', async () => {
      dto.spudDate = 'invalid-date';
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const spudDateError = errors.find(error => error.property === 'spudDate');
      expect(spudDateError).toBeDefined();
    });

    it('should pass validation with minimum required fields', async () => {
      const minimalDto = plainToClass(CreateWellDto, {
        name: 'Minimal Well',
        apiNumber: '4212345678',
        operatorId: 'operator-123',
        wellType: WellType.GAS,
        location: {
          latitude: 32.7767,
          longitude: -96.7970,
        },
      });

      const errors = await validate(minimalDto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation without optional fields', async () => {
      delete dto.leaseId;
      delete dto.spudDate;
      delete dto.totalDepth;
      delete dto.location.address;
      delete dto.location.county;
      delete dto.location.state;
      delete dto.location.country;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('data transformation', () => {
    it('should preserve all provided data', () => {
      expect(dto.name).toBe('Test Well #1');
      expect(dto.apiNumber).toBe('4212345678');
      expect(dto.operatorId).toBe('operator-123');
      expect(dto.wellType).toBe(WellType.OIL);
      expect(dto.totalDepth).toBe(5000);
      expect(dto.spudDate).toBe('2024-01-15');
      expect(dto.location.latitude).toBe(32.7767);
      expect(dto.location.longitude).toBe(-96.7970);
      expect(dto.location.address).toBe('123 Main St');
      expect(dto.location.county).toBe('Dallas');
      expect(dto.location.state).toBe('TX');
      expect(dto.location.country).toBe('USA');
    });

    it('should handle undefined optional fields', () => {
      const dtoWithoutOptional = plainToClass(CreateWellDto, {
        name: 'Test Well',
        apiNumber: '4212345678',
        operatorId: 'operator-123',
        wellType: WellType.GAS,
        location: {
          latitude: 32.7767,
          longitude: -96.7970,
        },
      });

      expect(dtoWithoutOptional.leaseId).toBeUndefined();
      expect(dtoWithoutOptional.spudDate).toBeUndefined();
      expect(dtoWithoutOptional.totalDepth).toBeUndefined();
      expect(dtoWithoutOptional.location.address).toBeUndefined();
      expect(dtoWithoutOptional.location.county).toBeUndefined();
      expect(dtoWithoutOptional.location.state).toBeUndefined();
      expect(dtoWithoutOptional.location.country).toBeUndefined();
    });

    it('should work with class-transformer', () => {
      const plainObject = {
        name: 'Transformed Well',
        apiNumber: '4212345679',
        operatorId: 'operator-456',
        wellType: 'oil',
        location: {
          latitude: 29.7604,
          longitude: -95.3698,
          address: '456 Oak St',
          county: 'Harris',
          state: 'TX',
          country: 'USA',
        },
        leaseId: 'lease-789',
        spudDate: '2024-03-01',
        totalDepth: 7500,
      };

      const transformedDto = plainToClass(CreateWellDto, plainObject);
      expect(transformedDto).toBeInstanceOf(CreateWellDto);
      expect(transformedDto.name).toBe('Transformed Well');
      expect(transformedDto.wellType).toBe('oil');
      expect(transformedDto.location.latitude).toBe(29.7604);
    });
  });

  describe('well types', () => {
    it('should accept all valid well types', async () => {
      const wellTypes = [WellType.OIL, WellType.GAS];

      for (const wellType of wellTypes) {
        dto.wellType = wellType;
        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle extreme coordinates', async () => {
      dto.location.latitude = 90; // North pole
      dto.location.longitude = 180; // Date line
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle negative coordinates', async () => {
      dto.location.latitude = -90; // South pole
      dto.location.longitude = -180; // Date line
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle very large total depth', async () => {
      dto.totalDepth = 50000; // Very deep well
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle zero total depth', async () => {
      dto.totalDepth = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle long strings', async () => {
      dto.name = 'A'.repeat(1000);
      dto.location.address = 'B'.repeat(1000);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
