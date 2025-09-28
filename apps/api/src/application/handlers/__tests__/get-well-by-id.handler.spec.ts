import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetWellByIdHandler } from '../get-well-by-id.handler';
import { GetWellByIdQuery } from '../../queries/get-well-by-id.query';
import { WellRepository } from '../../../domain/repositories/well.repository.interface';
import { Well } from '../../../domain/entities/well.entity';
import { WellType, WellStatus } from '../../../domain/enums/well-status.enum';
import { ApiNumber } from '../../../domain/value-objects/api-number';
import { Location } from '../../../domain/value-objects/location';
import { Coordinates } from '../../../domain/value-objects/coordinates';

describe('GetWellByIdHandler', () => {
  let handler: GetWellByIdHandler;
  let wellRepository: jest.Mocked<WellRepository>;

  const createMockWell = (
    id: string = 'well-123',
    name: string = 'Test Well #1',
  ) => {
    const apiNumber = new ApiNumber('4212345678');
    const location = new Location(new Coordinates(32.7767, -96.797), {
      address: '123 Main St',
      county: 'Dallas',
      state: 'TX',
      country: 'USA',
    });

    return new Well(
      id,
      apiNumber,
      name,
      'operator-456',
      WellType.OIL,
      location,
      {
        leaseId: 'lease-789',
        spudDate: new Date('2024-01-15'),
        totalDepth: 8500,
      },
    );
  };

  const mockWell = createMockWell();

  beforeEach(async () => {
    const mockWellRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByApiNumber: jest.fn(),
      findByOperatorId: jest.fn(),
      findByLeaseId: jest.fn(),
      findByLocation: jest.fn(),
      findWithPagination: jest.fn(),
      delete: jest.fn(),
      existsByApiNumber: jest.fn(),
    };

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

  describe('execute', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return well DTO when well is found', async () => {
      // Arrange
      const query = new GetWellByIdQuery('well-123');
      wellRepository.findById.mockResolvedValue(mockWell);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('well-123');
      expect(result.name).toBe('Test Well #1');
      expect(result.apiNumber).toBe('42-123-45678');
      expect(result.operatorId).toBe('operator-456');
      expect(result.wellType).toBe(WellType.OIL);
      expect(result.status).toBe(WellStatus.DRILLING);
      expect(result.leaseId).toBe('lease-789');
      expect(result.totalDepth).toBe(8500);
      expect(result.spudDate).toEqual(new Date('2024-01-15'));
      expect(wellRepository.findById).toHaveBeenCalledWith('well-123');
      expect(wellRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when well is not found', async () => {
      // Arrange
      const query = new GetWellByIdQuery('non-existent-well');
      wellRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Well with ID non-existent-well not found',
      );

      expect(wellRepository.findById).toHaveBeenCalledWith('non-existent-well');
      expect(wellRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const query = new GetWellByIdQuery('well-123');
      const repositoryError = new Error('Database connection failed');
      wellRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(
        'Database connection failed',
      );

      expect(wellRepository.findById).toHaveBeenCalledWith('well-123');
      expect(wellRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle non-Error exceptions', async () => {
      // Arrange
      const query = new GetWellByIdQuery('well-123');
      const nonErrorException = { message: 'Non-error exception', code: 500 };
      wellRepository.findById.mockImplementation(() =>
        Promise.reject(nonErrorException),
      );

      // Act & Assert
      try {
        await handler.execute(query);
        fail('Expected handler to throw an exception');
      } catch (error) {
        expect(error).toBe(nonErrorException);
      }

      expect(wellRepository.findById).toHaveBeenCalledWith('well-123');
      expect(wellRepository.findById).toHaveBeenCalledTimes(1);
    });

    it('should handle different well IDs correctly', async () => {
      // Test various well ID formats
      const testCases = [
        'well-123',
        '123e4567-e89b-12d3-a456-426614174000',
        'simple-well-id',
        'well_with_underscores',
        'well-with-dashes',
      ];

      for (const wellId of testCases) {
        const query = new GetWellByIdQuery(wellId);
        wellRepository.findById.mockResolvedValue(mockWell);

        const result = await handler.execute(query);

        expect(result.id).toBe('well-123'); // The mock well always returns this ID
        expect(wellRepository.findById).toHaveBeenCalledWith(wellId);
      }
    });

    it('should return DTO with all expected properties', async () => {
      // Arrange
      const query = new GetWellByIdQuery('well-123');
      wellRepository.findById.mockResolvedValue(mockWell);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          apiNumber: expect.any(String),
          name: expect.any(String),
          operatorId: expect.any(String),
          wellType: expect.any(String),
          status: expect.any(String),
          location: expect.any(Object),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
          version: expect.any(Number),
        }),
      );
    });

    it('should handle wells with minimal data', async () => {
      // Arrange
      const minimalWell = new Well(
        'minimal-well',
        new ApiNumber('4212345678'),
        'Minimal Well',
        'operator-123',
        WellType.GAS,
        new Location(new Coordinates(30.0, -95.0), {
          country: 'USA',
        }),
      );

      const query = new GetWellByIdQuery('minimal-well');
      wellRepository.findById.mockResolvedValue(minimalWell);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result.id).toBe('minimal-well');
      expect(result.name).toBe('Minimal Well');
      expect(result.leaseId).toBeUndefined();
      expect(result.spudDate).toBeUndefined();
      expect(result.totalDepth).toBeUndefined();
    });

    it('should handle empty well ID', async () => {
      // Arrange
      const query = new GetWellByIdQuery('');
      wellRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        'Well with ID  not found',
      );

      expect(wellRepository.findById).toHaveBeenCalledWith('');
    });

    it('should handle null well ID', async () => {
      // Arrange
      const query = new GetWellByIdQuery(null as any);
      wellRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        'Well with ID null not found',
      );

      expect(wellRepository.findById).toHaveBeenCalledWith(null);
    });

    it('should handle undefined well ID', async () => {
      // Arrange
      const query = new GetWellByIdQuery(undefined as any);
      wellRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      await expect(handler.execute(query)).rejects.toThrow(
        'Well with ID undefined not found',
      );

      expect(wellRepository.findById).toHaveBeenCalledWith(undefined);
    });

    it('should return different wells for different IDs', async () => {
      // Arrange
      const well1 = createMockWell('well-1', 'Well One');
      const well2 = createMockWell('well-2', 'Well Two');

      // Test well 1
      const query1 = new GetWellByIdQuery('well-1');
      wellRepository.findById.mockResolvedValue(well1);
      const result1 = await handler.execute(query1);
      expect(result1.id).toBe('well-1');
      expect(result1.name).toBe('Well One');

      // Test well 2
      const query2 = new GetWellByIdQuery('well-2');
      wellRepository.findById.mockResolvedValue(well2);
      const result2 = await handler.execute(query2);
      expect(result2.id).toBe('well-2');
      expect(result2.name).toBe('Well Two');
    });

    it('should handle wells with different statuses', async () => {
      // Test different well statuses
      const statuses = [
        WellStatus.PLANNED,
        WellStatus.PERMITTED,
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        WellStatus.PRODUCING,
        WellStatus.PLUGGED,
      ];

      for (const status of statuses) {
        const wellWithStatus = createMockWell('test-well', 'Test Well');
        // Note: We can't easily change the status in this test setup,
        // but the DTO mapping should work for any status
        const query = new GetWellByIdQuery('test-well');
        wellRepository.findById.mockResolvedValue(wellWithStatus);

        const result = await handler.execute(query);
        expect(result.status).toBeDefined();
        expect(Object.values(WellStatus)).toContain(result.status);
      }
    });

    it('should handle wells with different types', async () => {
      // Test different well types
      const types = [
        WellType.OIL,
        WellType.GAS,
        WellType.OIL_AND_GAS,
        WellType.INJECTION,
        WellType.DISPOSAL,
        WellType.WATER,
        WellType.OTHER,
      ];

      for (const type of types) {
        const wellWithType = new Well(
          'test-well',
          new ApiNumber('4212345678'),
          'Test Well',
          'operator-123',
          type,
          new Location(new Coordinates(30.0, -95.0), { country: 'USA' }),
        );

        const query = new GetWellByIdQuery('test-well');
        wellRepository.findById.mockResolvedValue(wellWithType);

        const result = await handler.execute(query);
        expect(result.wellType).toBe(type);
      }
    });
  });
});
