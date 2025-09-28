import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { CreateAfeApprovalHandler } from '../create-afe-approval.handler';
import { CreateAfeApprovalCommand } from '../../commands/create-afe-approval.command';
import type { IAfeApprovalRepository } from '../../../domain/repositories/afe-approval.repository.interface';
import type { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';
import { AfeApprovalWorkflowService } from '../../../domain/services/afe-approval-workflow.service';
import { AfeApproval } from '../../../domain/entities/afe-approval.entity';

import { AfeApprovalStatus } from '../../../domain/enums/afe-status.enum';
import { randomUUID } from 'crypto';

// Mock randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));
const mockRandomUUID = randomUUID as jest.MockedFunction<typeof randomUUID>;

// Mock AfeApproval
jest.mock('../../../domain/entities/afe-approval.entity');
const MockAfeApproval = AfeApproval as jest.MockedClass<typeof AfeApproval>;

describe('CreateAfeApprovalHandler', () => {
  let handler: CreateAfeApprovalHandler;
  let afeApprovalRepository: jest.Mocked<IAfeApprovalRepository>;
  let afeRepository: jest.Mocked<IAfeRepository>;
  let afeApprovalWorkflowService: jest.Mocked<AfeApprovalWorkflowService>;
  let _eventBus: jest.Mocked<EventBus>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRandomUUID.mockReturnValue('approval-123');

    const mockAfeApprovalRepository = {
      findByAfeAndPartner: jest.fn(),
      save: jest.fn(),
    };

    const mockAfeRepository = {
      findById: jest.fn(),
    };

    const mockAfeApprovalWorkflowService = {
      requiresPartnerApproval: jest.fn(),
    };

    const mockEventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAfeApprovalHandler,
        {
          provide: 'AfeApprovalRepository',
          useValue: mockAfeApprovalRepository,
        },
        {
          provide: 'AfeRepository',
          useValue: mockAfeRepository,
        },
        {
          provide: AfeApprovalWorkflowService,
          useValue: mockAfeApprovalWorkflowService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus,
        },
      ],
    }).compile();

    handler = module.get<CreateAfeApprovalHandler>(CreateAfeApprovalHandler);
    afeApprovalRepository = module.get('AfeApprovalRepository');
    afeRepository = module.get('AfeRepository');
    afeApprovalWorkflowService = module.get(AfeApprovalWorkflowService);
    _eventBus = module.get(EventBus);
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const command = new CreateAfeApprovalCommand(
      'afe-123',
      'partner-456',
      AfeApprovalStatus.APPROVED,
      10000,
      'Approved for drilling',
      'user-789',
    );

    it('should create AFE approval successfully', async () => {
      // Arrange
      const mockAfe = {
        getId: jest.fn().mockReturnValue('afe-123'),
      } as any;

      const mockApproval = {
        getId: jest.fn().mockReturnValue('approval-123'),
      };

      afeRepository.findById.mockResolvedValue(mockAfe);
      afeApprovalRepository.findByAfeAndPartner.mockResolvedValue(null);
      afeApprovalWorkflowService.requiresPartnerApproval.mockReturnValue(true);
      MockAfeApproval.mockImplementation(() => mockApproval as any);
      afeApprovalRepository.save.mockResolvedValue(mockApproval as any);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toBe('approval-123');
      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(afeApprovalRepository.findByAfeAndPartner).toHaveBeenCalledWith(
        'afe-123',
        'partner-456',
      );
      expect(
        afeApprovalWorkflowService.requiresPartnerApproval,
      ).toHaveBeenCalledWith(mockAfe);
      expect(MockAfeApproval).toHaveBeenCalledWith(
        'approval-123',
        'afe-123',
        'partner-456',
        AfeApprovalStatus.APPROVED,
        expect.objectContaining({
          approvedAmount: expect.any(Object), // Money instance
          comments: 'Approved for drilling',
          approvedByUserId: 'user-789',
          approvalDate: expect.any(Date),
        }),
      );
      expect(afeApprovalRepository.save).toHaveBeenCalledWith(mockApproval);
    });

    it('should throw NotFoundException if AFE does not exist', async () => {
      // Arrange
      afeRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE with ID afe-123 not found',
      );
    });

    it('should throw ConflictException if approval already exists', async () => {
      // Arrange
      const mockAfe = { getId: jest.fn().mockReturnValue('afe-123') } as any;
      const existingApproval = { id: 'existing-approval' } as any;

      afeRepository.findById.mockResolvedValue(mockAfe);
      afeApprovalRepository.findByAfeAndPartner.mockResolvedValue(
        existingApproval,
      );

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Approval already exists for AFE afe-123 and partner partner-456',
      );
    });

    it('should throw BadRequestException if AFE does not require approval', async () => {
      // Arrange
      const mockAfe = { getId: jest.fn().mockReturnValue('afe-123') } as any;

      afeRepository.findById.mockResolvedValue(mockAfe);
      afeApprovalRepository.findByAfeAndPartner.mockResolvedValue(null);
      afeApprovalWorkflowService.requiresPartnerApproval.mockReturnValue(false);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'AFE does not require partner approval',
      );
    });
  });
});
