import { CreateWellCommand } from '../create-well.command';
import { WellType } from '../../../domain/enums/well-status.enum';

describe('CreateWellCommand', () => {
  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const apiNumber = '4212345678';
      const name = 'Test Well #1';
      const operatorId = 'operator-123';
      const wellType = WellType.OIL;
      const location = {
        latitude: 32.7767,
        longitude: -96.797,
        address: '123 Main St',
        county: 'Dallas',
        state: 'TX',
        country: 'USA',
      };
      const leaseId = 'lease-456';
      const spudDate = new Date('2024-01-15');
      const totalDepth = 8500;
      const createdBy = 'user-789';

      const command = new CreateWellCommand(
        apiNumber,
        name,
        operatorId,
        wellType,
        location,
        leaseId,
        spudDate,
        totalDepth,
        createdBy,
      );

      expect(command.apiNumber).toBe(apiNumber);
      expect(command.name).toBe(name);
      expect(command.operatorId).toBe(operatorId);
      expect(command.wellType).toBe(wellType);
      expect(command.location).toEqual(location);
      expect(command.leaseId).toBe(leaseId);
      expect(command.spudDate).toBe(spudDate);
      expect(command.totalDepth).toBe(totalDepth);
      expect(command.createdBy).toBe(createdBy);
    });

    it('should create a command with minimal required properties', () => {
      const apiNumber = '4212345678';
      const name = 'Minimal Well';
      const operatorId = 'operator-123';
      const wellType = WellType.GAS;
      const location = {
        latitude: 32.7767,
        longitude: -96.797,
      };

      const command = new CreateWellCommand(
        apiNumber,
        name,
        operatorId,
        wellType,
        location,
      );

      expect(command.apiNumber).toBe(apiNumber);
      expect(command.name).toBe(name);
      expect(command.operatorId).toBe(operatorId);
      expect(command.wellType).toBe(wellType);
      expect(command.location).toEqual(location);
      expect(command.leaseId).toBeUndefined();
      expect(command.spudDate).toBeUndefined();
      expect(command.totalDepth).toBeUndefined();
      expect(command.createdBy).toBeUndefined();
    });

    it('should create a command with partial location data', () => {
      const location = {
        latitude: 32.7767,
        longitude: -96.797,
        county: 'Dallas',
        state: 'TX',
      };

      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        location,
      );

      expect(command.location.latitude).toBe(32.7767);
      expect(command.location.longitude).toBe(-96.797);
      expect(command.location.county).toBe('Dallas');
      expect(command.location.state).toBe('TX');
      expect(command.location.address).toBeUndefined();
      expect(command.location.country).toBeUndefined();
    });

    it('should handle different well types', () => {
      const oilCommand = new CreateWellCommand(
        '4212345678',
        'Oil Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
      );

      const gasCommand = new CreateWellCommand(
        '4212345679',
        'Gas Well',
        'operator-123',
        WellType.GAS,
        { latitude: 32.7767, longitude: -96.797 },
      );

      expect(oilCommand.wellType).toBe(WellType.OIL);
      expect(gasCommand.wellType).toBe(WellType.GAS);
    });

    it('should handle various date formats for spudDate', () => {
      const dateString = new Date('2024-01-15');
      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
        undefined,
        dateString,
      );

      expect(command.spudDate).toBe(dateString);
      expect(command.spudDate).toBeInstanceOf(Date);
    });

    it('should handle various totalDepth values', () => {
      const shallowWell = new CreateWellCommand(
        '4212345678',
        'Shallow Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
        undefined,
        undefined,
        1500,
      );

      const deepWell = new CreateWellCommand(
        '4212345679',
        'Deep Well',
        'operator-123',
        WellType.GAS,
        { latitude: 32.7767, longitude: -96.797 },
        undefined,
        undefined,
        15000,
      );

      expect(shallowWell.totalDepth).toBe(1500);
      expect(deepWell.totalDepth).toBe(15000);
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
      );

      // Properties should be accessible
      expect(command.apiNumber).toBeDefined();
      expect(command.name).toBeDefined();
      expect(command.operatorId).toBeDefined();
      expect(command.wellType).toBeDefined();
      expect(command.location).toBeDefined();
    });

    it('should maintain object references for complex properties', () => {
      const location = {
        latitude: 32.7767,
        longitude: -96.797,
        address: '123 Main St',
      };

      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        location,
      );

      expect(command.location).toBe(location);
      expect(command.location.address).toBe('123 Main St');
    });
  });

  describe('edge cases', () => {
    it('should handle empty optional string values', () => {
      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
        '', // empty lease ID
        undefined,
        undefined,
        '', // empty created by
      );

      expect(command.leaseId).toBe('');
      expect(command.createdBy).toBe('');
    });

    it('should handle zero totalDepth', () => {
      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
        undefined,
        undefined,
        0,
      );

      expect(command.totalDepth).toBe(0);
    });

    it('should handle location with negative coordinates', () => {
      const location = {
        latitude: -32.7767,
        longitude: -96.797,
      };

      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        location,
      );

      expect(command.location.latitude).toBe(-32.7767);
      expect(command.location.longitude).toBe(-96.797);
    });
  });

  describe('immutability', () => {
    it('should maintain consistent property values', () => {
      const command = new CreateWellCommand(
        '4212345678',
        'Test Well',
        'operator-123',
        WellType.OIL,
        { latitude: 32.7767, longitude: -96.797 },
      );

      const apiNumber1 = command.apiNumber;
      const apiNumber2 = command.apiNumber;
      const location1 = command.location;
      const location2 = command.location;

      expect(apiNumber1).toBe(apiNumber2);
      expect(location1).toBe(location2);
    });
  });
});
