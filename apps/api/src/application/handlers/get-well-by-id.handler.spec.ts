import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetWellByIdHandler } from './get-well-by-id.handler';
import { GetWellByIdQuery } from '../queries/get-well-by-id.query';
import { WellRepository } from '../../domain/repositories/well.repository.interface';
import { Well } from '../../domain/entities/well.entity';
import { WellStatus } from '../../domain/enums/well-status.enum';
import { WellType } from '../../domain/enums/well-status.enum';
import {
  createMockWell,
  createMinimalMockWell,
} from '../../test-utils/well-mock.helper';

describe('GetWellByIdHandler', () => {
  let handler: GetWellByIdHandler;
  let wellRepository: jest.Mocked<WellRepository>;

  const mockWellRepository = {
    findByApiNumber: jest.fn(),
    save: jest.fn(),
    findById: jest.fn(),
    findByOperator: jest.fn(),
    findNearby: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findWithPagination: jest.fn(),
  };

  const mockWell = {
    getId: jest.fn().mockReturnValue('well-123'),
    getApiNumber: jest.fn().mockReturnValue({ getValue: () => '42-123-45678' }),
    getName: jest.fn().mockReturnValue('Test Well'),
    getOperatorId: jest.fn().mockReturnValue('operator-123'),
    getWellType: jest.fn().mockReturnValue(WellType.OIL),
    getStatus: jest.fn().mockReturnValue(WellStatus.PLANNED),
    getLocation: jest.fn().mockReturnValue({
      getCoordinates: () => ({
        getLatitude: () => 40.7128,
        getLongitude: () => -74.006,
      }),
      getAddress: () => '123 Main St',
      getCounty: () => 'Dallas',
      getState: () => 'TX',
      getCountry: () => 'USA',
      toObject: () => ({
        coordinates: {
          latitude: 40.7128,
          longitude: -74.006,
        },
        address: '123 Main St',
        county: 'Dallas',
        state: 'TX',
        country: 'USA',
      }),
    }),
    getLeaseId: jest.fn().mockReturnValue('lease-123'),
    getSpudDate: jest.fn().mockReturnValue(new Date('2024-01-01')),
    getCompletionDate: jest.fn().mockReturnValue(null),
    getTotalDepth: jest.fn().mockReturnValue(5000),
    getCreatedAt: jest.fn().mockReturnValue(new Date('2024-01-01T10:00:00Z')),
    getUpdatedAt: jest.fn().mockReturnValue(new Date('2024-01-01T10:00:00Z')),
    getVersion: jest.fn().mockReturnValue(1),
  } as unknown as Well;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetWellByIdHandler,
        {
          provide: 'WellRepository',
          useValue: mockWellRepository,
        },
      ],
    }).compile();

    handler = module.get<GetWellByIdHandler>(GetWellByIdHandler);
    wellRepository = module.get('WellRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validQuery = new GetWellByIdQuery('well-123');

    it('should return well DTO when well exists', async () => {
      wellRepository.findById.mockResolvedValue(mockWell);

      const result = await handler.execute(validQuery);

      expect((wellRepository.findById as jest.Mock).mock.calls[0][0]).toBe(
        'well-123',
      );
      expect(result).toBeDefined();
      expect(result.id).toBe('well-123');
      expect(result.apiNumber).toBe('42-123-45678');
      expect(result.name).toBe('Test Well');
      expect(result.operatorId).toBe('operator-123');
      expect(result.wellType).toBe(WellType.OIL);
      expect(result.status).toBe(WellStatus.PLANNED);
    });

    it('should throw NotFoundException when well does not exist', async () => {
      wellRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(validQuery)).rejects.toThrow(
        NotFoundException,
      );
      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Well with ID well-123 not found',
      );
      expect((wellRepository.findById as jest.Mock).mock.calls[0][0]).toBe(
        'well-123',
      );
    });

    it('should handle different well IDs', async () => {
      const wellIds = ['well-001', 'well-002', 'well-003'];

      wellRepository.findById.mockResolvedValue(mockWell);

      for (const wellId of wellIds) {
        const query = new GetWellByIdQuery(wellId);
        const result = await handler.execute(query);

        expect(
          (wellRepository.findById as jest.Mock).mock.calls,
        ).toContainEqual([wellId]);
        expect(result).toBeDefined();
      }

      expect((wellRepository.findById as jest.Mock).mock.calls.length).toBe(
        wellIds.length,
      );
    });

    it('should handle repository errors', async () => {
      wellRepository.findById.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Database connection failed',
      );
      expect((wellRepository.findById as jest.Mock).mock.calls[0][0]).toBe(
        'well-123',
      );
    });

    it('should handle well with minimal data', async () => {
      const minimalWell = createMinimalMockWell({
        id: 'well-minimal',
        apiNumber: '42-123-00000',
        name: 'Minimal Well',
        operatorId: 'operator-minimal',
        wellType: WellType.GAS,
        status: WellStatus.DRILLING,
      });

      wellRepository.findById.mockResolvedValue(minimalWell);

      const query = new GetWellByIdQuery('well-minimal');
      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.id).toBe('well-minimal');
      expect(result.apiNumber).toBe('42-123-00000');
      expect(result.name).toBe('Minimal Well');
      expect(result.wellType).toBe(WellType.GAS);
      expect(result.status).toBe(WellStatus.DRILLING);
      expect(result.leaseId).toBeNull();
      expect(result.spudDate).toBeNull();
      expect(result.totalDepth).toBeNull();
    });

    it('should handle well with all optional fields populated', async () => {
      const fullWell = {
        getId: jest.fn().mockReturnValue('well-full'),
        getApiNumber: jest
          .fn()
          .mockReturnValue({ getValue: () => '42-123-99999' }),
        getName: jest.fn().mockReturnValue('Full Well'),
        getOperatorId: jest.fn().mockReturnValue('operator-full'),
        getWellType: jest.fn().mockReturnValue(WellType.OIL),
        getStatus: jest.fn().mockReturnValue(WellStatus.PRODUCING),
        getLocation: jest.fn().mockReturnValue({
          getCoordinates: () => ({
            getLatitude: () => 29.7604,
            getLongitude: () => -95.3698,
          }),
          getAddress: () => '456 Oak Street',
          getCounty: () => 'Harris',
          getState: () => 'TX',
          getCountry: () => 'USA',
          toObject: () => ({
            coordinates: {
              latitude: 29.7604,
              longitude: -95.3698,
            },
            address: '456 Oak Street',
            county: 'Harris',
            state: 'TX',
            country: 'USA',
          }),
        }),
        getLeaseId: jest.fn().mockReturnValue('lease-full'),
        getSpudDate: jest.fn().mockReturnValue(new Date('2024-03-15')),
        getCompletionDate: jest.fn().mockReturnValue(new Date('2024-04-15')),
        getTotalDepth: jest.fn().mockReturnValue(8500),
        getCreatedAt: jest
          .fn()
          .mockReturnValue(new Date('2024-03-01T10:00:00Z')),
        getUpdatedAt: jest
          .fn()
          .mockReturnValue(new Date('2024-04-20T10:00:00Z')),
        getVersion: jest.fn().mockReturnValue(3),
      };

      wellRepository.findById.mockResolvedValue(
        fullWell as unknown as jest.Mocked<Well>,
      );

      const query = new GetWellByIdQuery('well-full');
      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.id).toBe('well-full');
      expect(result.apiNumber).toBe('42-123-99999');
      expect(result.name).toBe('Full Well');
      expect(result.wellType).toBe(WellType.OIL);
      expect(result.status).toBe(WellStatus.PRODUCING);
      expect(result.leaseId).toBe('lease-full');
      expect(result.spudDate).toEqual(new Date('2024-03-15'));
      expect(result.completionDate).toEqual(new Date('2024-04-15'));
      expect(result.totalDepth).toBe(8500);
      expect(result.version).toBe(3);
    });

    it('should handle different well statuses', async () => {
      const statuses = [
        WellStatus.PLANNED,
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        WellStatus.PRODUCING,
        WellStatus.SHUT_IN,
        WellStatus.PLUGGED,
      ];

      for (const status of statuses) {
        const wellWithStatus = createMockWell({
          status: status,
        });

        wellRepository.findById.mockResolvedValue(wellWithStatus);

        const result = await handler.execute(validQuery);

        expect(result.status).toBe(status);
      }
    });

    it('should handle different well types', async () => {
      const types = [WellType.OIL, WellType.GAS];

      for (const type of types) {
        const wellWithType = createMockWell({
          wellType: type,
        });

        wellRepository.findById.mockResolvedValue(wellWithType);

        const result = await handler.execute(validQuery);

        expect(result.wellType).toBe(type);
      }
    });

    it('should handle UUID format well IDs', async () => {
      const uuidWellId = '550e8400-e29b-41d4-a716-446655440000';
      const mockWellForUuid = createMockWell();
      wellRepository.findById.mockResolvedValue(mockWellForUuid);

      const query = new GetWellByIdQuery(uuidWellId);
      const result = await handler.execute(query);

      expect(wellRepository.findById).toHaveBeenCalledWith(uuidWellId);
      expect(result).toBeDefined();
    });

    it('should handle short string well IDs', async () => {
      const shortWellId = 'w1';
      wellRepository.findById.mockResolvedValue(mockWell as jest.Mocked<Well>);

      const query = new GetWellByIdQuery(shortWellId);
      const result = await handler.execute(query);

      expect(wellRepository.findById).toHaveBeenCalledWith(shortWellId);
      expect(result).toBeDefined();
    });

    it('should handle long string well IDs', async () => {
      const longWellId =
        'very-long-well-identifier-with-many-characters-and-dashes';
      wellRepository.findById.mockResolvedValue(mockWell as jest.Mocked<Well>);

      const query = new GetWellByIdQuery(longWellId);
      const result = await handler.execute(query);

      expect(wellRepository.findById).toHaveBeenCalledWith(longWellId);
      expect(result).toBeDefined();
    });

    it('should handle special characters in well IDs', async () => {
      const specialWellId = 'well_123-abc@domain.com';
      wellRepository.findById.mockResolvedValue(mockWell as jest.Mocked<Well>);

      const query = new GetWellByIdQuery(specialWellId);
      const result = await handler.execute(query);

      expect(wellRepository.findById).toHaveBeenCalledWith(specialWellId);
      expect(result).toBeDefined();
    });

    it('should handle concurrent queries', async () => {
      wellRepository.findById.mockResolvedValue(mockWell as jest.Mocked<Well>);

      const queries = [
        new GetWellByIdQuery('well-1'),
        new GetWellByIdQuery('well-2'),
        new GetWellByIdQuery('well-3'),
      ];

      const promises = queries.map((query) => handler.execute(query));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
      expect(wellRepository.findById).toHaveBeenCalledTimes(3);
    });

    it('should handle repository timeout errors', async () => {
      wellRepository.findById.mockRejectedValue(new Error('Query timeout'));

      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Query timeout',
      );
      expect(wellRepository.findById).toHaveBeenCalledWith('well-123');
    });

    it('should handle repository network errors', async () => {
      wellRepository.findById.mockRejectedValue(
        new Error('Network unreachable'),
      );

      await expect(handler.execute(validQuery)).rejects.toThrow(
        'Network unreachable',
      );
      expect(wellRepository.findById).toHaveBeenCalledWith('well-123');
    });
  });
});
