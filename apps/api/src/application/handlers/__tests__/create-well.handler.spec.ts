// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CreateWellHandler } from '../create-well.handler';
import { CreateWellCommand } from '../../commands/create-well.command';
import { WellRepository } from '../../../domain/repositories/well.repository.interface';
import { Well } from '../../../domain/entities/well.entity';
import { ApiNumber } from '../../../domain/value-objects/api-number';
import { Location } from '../../../domain/value-objects/location';
import { Coordinates } from '../../../domain/value-objects/coordinates';
import { WellType } from '../../../domain/enums/well-status.enum';
import { UnitOfWork } from '../../../infrastructure/repositories/unit-of-work';
import { AuditLogService } from '../../services/audit-log.service';

// Mock the Well entity
jest.mock('../../../domain/entities/well.entity');
const MockWell = Well as any;

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
const mockRandomUUID = require('crypto').randomUUID;

describe('CreateWellHandler', () => {
  let handler: CreateWellHandler;
  let wellRepository: jest.Mocked<WellRepository>;
  let unitOfWork: jest.Mocked<UnitOfWork>;
  let eventBus: jest.Mocked<EventBus>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockLocation = {
    latitude: 40.7128,
    longitude: -74.006,
    address: '123 Main St',
    county: 'Harris',
    state: 'TX',
    country: 'USA',
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Set up default mocks
    mockRandomUUID.mockReturnValue('well-123');
    MockWell.mockImplementation((id) => ({
      id,
      getDomainEvents: jest.fn().mockReturnValue([]),
      clearDomainEvents: jest.fn(),
    }));

    const mockWellRepository = {
      findByApiNumber: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      findByOperator: jest.fn(),
      findByLease: jest.fn(),
      findByStatus: jest.fn(),
      findByType: jest.fn(),
      findByLocation: jest.fn(),
      updateStatus: jest.fn(),
      getWellStatistics: jest.fn(),
      exists: jest.fn(),
    };

    const mockUnitOfWork = {
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      registerNew: jest.fn(),
      registerDirty: jest.fn(),
      registerDeleted: jest.fn(),
      isInTransaction: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const mockAuditLogService = {
      logExecute: jest.fn(),
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateWellHandler,
        {
          provide: 'WellRepository',
          useValue: mockWellRepository,
        },
        {
          provide: UnitOfWork,
          useValue: mockUnitOfWork,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    handler = module.get<CreateWellHandler>(CreateWellHandler);
    wellRepository = module.get('WellRepository');
    unitOfWork = module.get(UnitOfWork);
    eventBus = module.get(EventBus);
    auditLogService = module.get(AuditLogService);
  });

  describe('execute', () => {
    const validCommand = new CreateWellCommand(
      '1234567890',
      'Test Well #1',
      'operator-123',
      WellType.OIL,
      mockLocation,
      'lease-456',
      new Date('2023-01-01'),
      8500,
      'user-789',
    );

    it('should create a well successfully', async () => {
      // Arrange
      wellRepository.findByApiNumber.mockResolvedValue(null);

      // Act
      const result = await handler.execute(validCommand);

      // Assert
      expect(result).toBe('well-123');
      expect(unitOfWork.begin).toHaveBeenCalled();
      expect(wellRepository.findByApiNumber).toHaveBeenCalledWith(
        expect.any(ApiNumber),
      );
      expect(unitOfWork.registerNew).toHaveBeenCalled();
      expect(unitOfWork.commit).toHaveBeenCalled();
      expect(auditLogService.logExecute).toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled(); // No events in this case
    });

    it('should create value objects correctly', async () => {
      // Arrange
      wellRepository.findByApiNumber.mockResolvedValue(null);

      const mockWell = {
        id: 'well-123',
        getDomainEvents: jest.fn().mockReturnValue([]),
        clearDomainEvents: jest.fn(),
      };

      (Well as jest.MockedClass<typeof Well>).mockImplementation(
        () => mockWell,
      );

      // Act
      await handler.execute(validCommand);

      // Assert - Verify Well constructor was called with correct value objects
      expect(Well).toHaveBeenCalledWith(
        expect.any(String), // wellId
        expect.any(ApiNumber), // apiNumber
        'Test Well #1', // name
        'operator-123', // operatorId
        WellType.OIL, // wellType
        expect.any(Location), // location
        expect.objectContaining({
          leaseId: 'lease-456',
          spudDate: new Date('2023-01-01'),
          totalDepth: 8500,
        }),
      );
    });

    it('should throw ConflictException if API number already exists', async () => {
      // Arrange
      const existingWell = {
        id: 'existing-well-123',
        apiNumber: new ApiNumber('1234567890'),
      } as Well;

      wellRepository.findByApiNumber.mockResolvedValue(existingWell);

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        ConflictException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Well with API number 12-345-67890 already exists',
      );

      expect(unitOfWork.begin).toHaveBeenCalled();
      expect(unitOfWork.commit).not.toHaveBeenCalled();
      expect(unitOfWork.rollback).toHaveBeenCalled();
      expect(auditLogService.logAction).toHaveBeenCalled();
    });

    it('should handle API number validation errors', async () => {
      // Arrange
      const invalidCommand = new CreateWellCommand(
        'invalid-api',
        'Test Well',
        'operator-123',
        WellType.OIL,
        mockLocation,
      );

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        'Failed to create well: API Number must be exactly 10 digits',
      );

      expect(unitOfWork.rollback).toHaveBeenCalled();
      expect(auditLogService.logAction).toHaveBeenCalled();
    });

    it('should handle coordinates validation errors', async () => {
      // Arrange
      const invalidLocation = {
        ...mockLocation,
        latitude: 91, // Invalid latitude
        longitude: -74.006,
      };

      const invalidCommand = new CreateWellCommand(
        '1234567890',
        'Test Well',
        'operator-123',
        WellType.OIL,
        invalidLocation,
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(invalidCommand)).rejects.toThrow(
        BadRequestException,
      );

      expect(unitOfWork.rollback).toHaveBeenCalled();
      expect(auditLogService.logAction).toHaveBeenCalled();
    });

    it('should publish domain events after successful creation', async () => {
      // Arrange
      wellRepository.findByApiNumber.mockResolvedValue(null);

      const mockEvent = { eventType: 'WellCreatedEvent' };
      const mockWell = {
        id: 'well-123',
        getDomainEvents: jest.fn().mockReturnValue([mockEvent]),
        clearDomainEvents: jest.fn(),
      } as jest.Mocked<Well>;

      (Well as jest.MockedClass<typeof Well>).mockImplementation(
        () => mockWell,
      );

      // Act
      await handler.execute(validCommand);

      // Assert
      expect(eventBus.publish).toHaveBeenCalledWith(mockEvent);
      expect(mockWell.clearDomainEvents).toHaveBeenCalled();
    });

    it('should handle unit of work commit failures', async () => {
      // Arrange
      wellRepository.findByApiNumber.mockResolvedValue(null);

      const mockWell = {
        id: 'well-123',
        getDomainEvents: jest.fn().mockReturnValue([]),
        clearDomainEvents: jest.fn(),
      };

      (Well as jest.MockedClass<typeof Well>).mockImplementation(
        () => mockWell,
      );

      unitOfWork.commit.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to create well: Database connection failed',
      );

      expect(unitOfWork.rollback).toHaveBeenCalled();
      expect(auditLogService.logAction).toHaveBeenCalled();
    });

    it('should handle audit logging failures', async () => {
      // Arrange
      wellRepository.findByApiNumber.mockResolvedValue(null);
      auditLogService.logExecute.mockRejectedValue(
        new Error('Audit log failed'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );
      await expect(handler.execute(validCommand)).rejects.toThrow(
        'Failed to create well: Audit log failed',
      );

      expect(unitOfWork.commit).toHaveBeenCalled();
      expect(unitOfWork.rollback).toHaveBeenCalled();
    });

    it('should create wells with different types', async () => {
      // Test different well types
      const wellTypes = [
        WellType.OIL,
        WellType.GAS,
        WellType.OIL_AND_GAS,
        WellType.INJECTION,
        WellType.DISPOSAL,
        WellType.WATER,
        WellType.OTHER,
      ];

      for (const wellType of wellTypes) {
        const command = new CreateWellCommand(
          '1234567890',
          `Test ${wellType} Well`,
          'operator-123',
          wellType,
          mockLocation,
        );

        wellRepository.findByApiNumber.mockResolvedValue(null);

        mockRandomUUID.mockReturnValue(`well-${wellType}`);

        const result = await handler.execute(command);
        expect(result).toBe(`well-${wellType}`);
      }
    });

    it('should handle optional fields correctly', async () => {
      // Arrange
      const commandWithoutOptionals = new CreateWellCommand(
        '1234567890',
        'Minimal Well',
        'operator-123',
        WellType.OIL,
        {
          latitude: 40.7128,
          longitude: -74.006,
        }, // Minimal location
      );

      wellRepository.findByApiNumber.mockResolvedValue(null);

      mockRandomUUID.mockReturnValue('well-minimal');

      // Act
      const result = await handler.execute(commandWithoutOptionals);

      // Assert
      expect(result).toBe('well-minimal');
      expect(Well).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(ApiNumber),
        'Minimal Well',
        'operator-123',
        WellType.OIL,
        expect.any(Location),
        expect.objectContaining({
          leaseId: undefined,
          spudDate: undefined,
          totalDepth: undefined,
        }),
      );
    });

    it('should rollback transaction on any error', async () => {
      // Arrange
      wellRepository.findByApiNumber.mockRejectedValue(
        new Error('Repository error'),
      );

      // Act & Assert
      await expect(handler.execute(validCommand)).rejects.toThrow(
        BadRequestException,
      );

      expect(unitOfWork.begin).toHaveBeenCalled();
      expect(unitOfWork.rollback).toHaveBeenCalled();
      expect(unitOfWork.commit).not.toHaveBeenCalled();
      expect(auditLogService.logAction).toHaveBeenCalled();
    });
  });
});
