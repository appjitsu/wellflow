import { WellDto } from './well.dto';
import { Well } from '../../domain/entities/well.entity';
import { WellStatus, WellType } from '../../domain/enums/well-status.enum';
import { ApiNumber } from '../../domain/value-objects/api-number';
import { Location } from '../../domain/value-objects/location';
import { Coordinates } from '../../domain/value-objects/coordinates';

describe('WellDto', () => {
  let wellDto: WellDto;
  let mockWell: Well;

  beforeEach(() => {
    // Create a mock Well entity
    const apiNumber = new ApiNumber('4212345678');
    const location = new Location(new Coordinates(32.7767, -96.797), {
      address: '123 Main St',
      county: 'Dallas',
      state: 'TX',
      country: 'USA',
    });

    mockWell = new Well(
      'well-123',
      apiNumber,
      'Test Well #1',
      'operator-456',
      WellType.OIL,
      location,
      {
        leaseId: 'lease-789',
        spudDate: new Date('2024-01-15'),
        totalDepth: 8500,
      },
    );

    // Create WellDto manually for testing
    wellDto = new WellDto();
    wellDto.id = 'well-123';
    wellDto.apiNumber = '42-123-45678';
    wellDto.name = 'Test Well #1';
    wellDto.operatorId = 'operator-456';
    wellDto.leaseId = 'lease-789';
    wellDto.wellType = WellType.OIL;
    wellDto.status = WellStatus.DRILLING;
    wellDto.location = {
      coordinates: {
        latitude: 32.7767,
        longitude: -96.797,
      },
      address: '123 Main St',
      county: 'Dallas',
      state: 'TX',
      country: 'USA',
    };
    wellDto.spudDate = new Date('2024-01-15');
    wellDto.completionDate = new Date('2024-02-15');
    wellDto.totalDepth = 8500;
    wellDto.createdAt = new Date('2024-01-01');
    wellDto.updatedAt = new Date('2024-01-16');
    wellDto.version = 1;
  });

  describe('properties', () => {
    it('should have all required properties', () => {
      expect(wellDto.id).toBeDefined();
      expect(wellDto.apiNumber).toBeDefined();
      expect(wellDto.name).toBeDefined();
      expect(wellDto.operatorId).toBeDefined();
      expect(wellDto.wellType).toBeDefined();
      expect(wellDto.status).toBeDefined();
      expect(wellDto.location).toBeDefined();
      expect(wellDto.createdAt).toBeDefined();
      expect(wellDto.updatedAt).toBeDefined();
      expect(wellDto.version).toBeDefined();
    });

    it('should have correct property types', () => {
      expect(typeof wellDto.id).toBe('string');
      expect(typeof wellDto.apiNumber).toBe('string');
      expect(typeof wellDto.name).toBe('string');
      expect(typeof wellDto.operatorId).toBe('string');
      expect(typeof wellDto.wellType).toBe('string');
      expect(typeof wellDto.status).toBe('string');
      expect(typeof wellDto.location).toBe('object');
      expect(wellDto.createdAt).toBeInstanceOf(Date);
      expect(wellDto.updatedAt).toBeInstanceOf(Date);
      expect(typeof wellDto.version).toBe('number');
    });

    it('should handle optional properties', () => {
      const minimalDto = new WellDto();
      minimalDto.id = 'well-minimal';
      minimalDto.apiNumber = '42-123-45679';
      minimalDto.name = 'Minimal Well';
      minimalDto.operatorId = 'operator-123';
      minimalDto.wellType = WellType.GAS;
      minimalDto.status = WellStatus.PLANNED;
      minimalDto.location = {
        coordinates: { latitude: 29.7604, longitude: -95.3698 },
        country: 'USA',
      };
      minimalDto.createdAt = new Date();
      minimalDto.updatedAt = new Date();
      minimalDto.version = 1;

      expect(minimalDto.leaseId).toBeUndefined();
      expect(minimalDto.spudDate).toBeUndefined();
      expect(minimalDto.completionDate).toBeUndefined();
      expect(minimalDto.totalDepth).toBeUndefined();
      expect(minimalDto.location.address).toBeUndefined();
      expect(minimalDto.location.county).toBeUndefined();
      expect(minimalDto.location.state).toBeUndefined();
    });
  });

  describe('location structure', () => {
    it('should have correct location structure', () => {
      expect(wellDto.location.coordinates).toBeDefined();
      expect(wellDto.location.coordinates.latitude).toBe(32.7767);
      expect(wellDto.location.coordinates.longitude).toBe(-96.797);
      expect(wellDto.location.address).toBe('123 Main St');
      expect(wellDto.location.county).toBe('Dallas');
      expect(wellDto.location.state).toBe('TX');
      expect(wellDto.location.country).toBe('USA');
    });

    it('should handle location without optional fields', () => {
      const dtoWithMinimalLocation = new WellDto();
      dtoWithMinimalLocation.location = {
        coordinates: { latitude: 30.0, longitude: -90.0 },
        country: 'USA',
      };

      expect(dtoWithMinimalLocation.location.coordinates.latitude).toBe(30.0);
      expect(dtoWithMinimalLocation.location.coordinates.longitude).toBe(-90.0);
      expect(dtoWithMinimalLocation.location.country).toBe('USA');
      expect(dtoWithMinimalLocation.location.address).toBeUndefined();
      expect(dtoWithMinimalLocation.location.county).toBeUndefined();
      expect(dtoWithMinimalLocation.location.state).toBeUndefined();
    });
  });

  describe('fromEntity static method', () => {
    it('should create WellDto from Well entity', () => {
      // Mock the Well entity methods
      jest.spyOn(mockWell, 'getId').mockReturnValue('well-123');
      jest
        .spyOn(mockWell, 'getApiNumber')
        .mockReturnValue(new ApiNumber('4212345678'));
      jest.spyOn(mockWell, 'getName').mockReturnValue('Test Well #1');
      jest.spyOn(mockWell, 'getOperatorId').mockReturnValue('operator-456');
      jest.spyOn(mockWell, 'getLeaseId').mockReturnValue('lease-789');
      jest.spyOn(mockWell, 'getWellType').mockReturnValue(WellType.OIL);
      jest.spyOn(mockWell, 'getStatus').mockReturnValue(WellStatus.DRILLING);
      // Create a proper Location mock with correct typing
      const mockLocation = new Location(new Coordinates(32.7767, -96.797), {
        address: '123 Main St',
        county: 'Dallas',
        state: 'TX',
        country: 'USA',
      });
      jest.spyOn(mockWell, 'getLocation').mockReturnValue(mockLocation);
      jest
        .spyOn(mockWell, 'getSpudDate')
        .mockReturnValue(new Date('2024-01-15'));
      jest
        .spyOn(mockWell, 'getCompletionDate')
        .mockReturnValue(new Date('2024-02-15'));
      jest.spyOn(mockWell, 'getTotalDepth').mockReturnValue(8500);
      jest
        .spyOn(mockWell, 'getCreatedAt')
        .mockReturnValue(new Date('2024-01-01'));
      jest
        .spyOn(mockWell, 'getUpdatedAt')
        .mockReturnValue(new Date('2024-01-16'));
      jest.spyOn(mockWell, 'getVersion').mockReturnValue(1);

      const dto = WellDto.fromEntity(mockWell);

      expect(dto.id).toBe('well-123');
      expect(dto.apiNumber).toBe('42-123-45678');
      expect(dto.name).toBe('Test Well #1');
      expect(dto.operatorId).toBe('operator-456');
      expect(dto.leaseId).toBe('lease-789');
      expect(dto.wellType).toBe(WellType.OIL);
      expect(dto.status).toBe(WellStatus.DRILLING);
      expect(dto.location.coordinates.latitude).toBe(32.7767);
      expect(dto.location.coordinates.longitude).toBe(-96.797);
      expect(dto.spudDate).toEqual(new Date('2024-01-15'));
      expect(dto.completionDate).toEqual(new Date('2024-02-15'));
      expect(dto.totalDepth).toBe(8500);
      expect(dto.createdAt).toEqual(new Date('2024-01-01'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-16'));
      expect(dto.version).toBe(1);
    });

    it('should handle entity with null optional fields', () => {
      jest.spyOn(mockWell, 'getId').mockReturnValue('well-minimal');
      jest
        .spyOn(mockWell, 'getApiNumber')
        .mockReturnValue(new ApiNumber('4212345679'));
      jest.spyOn(mockWell, 'getName').mockReturnValue('Minimal Well');
      jest.spyOn(mockWell, 'getOperatorId').mockReturnValue('operator-123');
      jest.spyOn(mockWell, 'getLeaseId').mockReturnValue(undefined);
      jest.spyOn(mockWell, 'getWellType').mockReturnValue(WellType.GAS);
      jest.spyOn(mockWell, 'getStatus').mockReturnValue(WellStatus.PLANNED);
      // Create a proper Location mock with correct typing
      const mockLocationMinimal = new Location(
        new Coordinates(29.7604, -95.3698),
      );
      jest.spyOn(mockWell, 'getLocation').mockReturnValue(mockLocationMinimal);
      jest.spyOn(mockWell, 'getSpudDate').mockReturnValue(undefined);
      jest.spyOn(mockWell, 'getCompletionDate').mockReturnValue(undefined);
      jest.spyOn(mockWell, 'getTotalDepth').mockReturnValue(undefined);
      jest
        .spyOn(mockWell, 'getCreatedAt')
        .mockReturnValue(new Date('2024-01-01'));
      jest
        .spyOn(mockWell, 'getUpdatedAt')
        .mockReturnValue(new Date('2024-01-01'));
      jest.spyOn(mockWell, 'getVersion').mockReturnValue(1);

      const dto = WellDto.fromEntity(mockWell);

      expect(dto.id).toBe('well-minimal');
      expect(dto.leaseId).toBeUndefined();
      expect(dto.spudDate).toBeUndefined();
      expect(dto.completionDate).toBeUndefined();
      expect(dto.totalDepth).toBeUndefined();
    });
  });

  describe('serialization', () => {
    it('should serialize to JSON correctly', () => {
      const json = JSON.stringify(wellDto);
      const parsed = JSON.parse(json) as {
        id: string;
        apiNumber: string;
        name: string;
        wellType: string;
        status: string;
        location: { coordinates: { latitude: number; longitude: number } };
        version: number;
      };

      expect(parsed.id).toBe('well-123');
      expect(parsed.apiNumber).toBe('42-123-45678');
      expect(parsed.name).toBe('Test Well #1');
      expect(parsed.wellType).toBe(WellType.OIL);
      expect(parsed.status).toBe(WellStatus.DRILLING);
      expect(parsed.location.coordinates.latitude).toBe(32.7767);
      expect(parsed.version).toBe(1);
    });

    it('should handle date serialization', () => {
      const json = JSON.stringify(wellDto);
      const parsed = JSON.parse(json) as {
        spudDate: string;
        completionDate: string;
        createdAt: string;
        updatedAt: string;
      };

      expect(parsed.spudDate).toBe('2024-01-15T00:00:00.000Z');
      expect(parsed.completionDate).toBe('2024-02-15T00:00:00.000Z');
      expect(parsed.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(parsed.updatedAt).toBe('2024-01-16T00:00:00.000Z');
    });
  });

  describe('edge cases', () => {
    it('should handle extreme coordinates', () => {
      wellDto.location.coordinates.latitude = 90; // North pole
      wellDto.location.coordinates.longitude = 180; // Date line

      expect(wellDto.location.coordinates.latitude).toBe(90);
      expect(wellDto.location.coordinates.longitude).toBe(180);
    });

    it('should handle very large total depth', () => {
      wellDto.totalDepth = 50000;
      expect(wellDto.totalDepth).toBe(50000);
    });

    it('should handle zero total depth', () => {
      wellDto.totalDepth = 0;
      expect(wellDto.totalDepth).toBe(0);
    });

    it('should handle future dates', () => {
      const futureDate = new Date('2030-12-31');
      wellDto.spudDate = futureDate;
      expect(wellDto.spudDate).toEqual(futureDate);
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('1900-01-01');
      wellDto.spudDate = oldDate;
      expect(wellDto.spudDate).toEqual(oldDate);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const originalId = wellDto.id;
      const originalName = wellDto.name;
      const originalLocation = wellDto.location;

      expect(wellDto.id).toBe(originalId);
      expect(wellDto.name).toBe(originalName);
      expect(wellDto.location).toBe(originalLocation);

      // Multiple accesses should return same values
      expect(wellDto.id).toBe(wellDto.id);
      expect(wellDto.location.coordinates.latitude).toBe(
        wellDto.location.coordinates.latitude,
      );
    });
  });
});
