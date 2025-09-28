import { Test, TestingModule } from '@nestjs/testing';
import { GetAfesRequiringApprovalHandler } from '../get-afes-requiring-approval.handler';
import { GetAfesRequiringApprovalQuery } from '../../queries/get-afes-requiring-approval.query';
import type { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';
import { AfeDto } from '../../dtos/afe.dto';

// Mock AfeDto
jest.mock('../../dtos/afe.dto');
const MockAfeDto = AfeDto as jest.MockedClass<typeof AfeDto>;

describe('GetAfesRequiringApprovalHandler', () => {
  let handler: GetAfesRequiringApprovalHandler;
  let afeRepository: jest.Mocked<IAfeRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const mockAfeRepository = {
      findRequiringApproval: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAfesRequiringApprovalHandler,
        {
          provide: 'AfeRepository',
          useValue: mockAfeRepository,
        },
      ],
    }).compile();

    handler = module.get<GetAfesRequiringApprovalHandler>(
      GetAfesRequiringApprovalHandler,
    );
    afeRepository = module.get('AfeRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    const query = new GetAfesRequiringApprovalQuery('org-123');

    it('should return AFEs requiring approval', async () => {
      // Arrange
      const mockAfes = [{ id: 'afe-1' }, { id: 'afe-2' }] as any[];
      const mockDtos = [
        { id: 'afe-1', organizationId: 'org-123' },
        { id: 'afe-2', organizationId: 'org-123' },
      ] as AfeDto[];

      afeRepository.findRequiringApproval.mockResolvedValue(mockAfes);
      (MockAfeDto.fromEntities as jest.Mock).mockReturnValue(mockDtos);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(afeRepository.findRequiringApproval).toHaveBeenCalledWith(
        'org-123',
      );
      expect(MockAfeDto.fromEntities).toHaveBeenCalledWith(mockAfes);
      expect(result).toBe(mockDtos);
    });

    it('should return empty array if no AFEs require approval', async () => {
      // Arrange
      const mockAfes: any[] = [];
      const mockDtos: AfeDto[] = [];

      afeRepository.findRequiringApproval.mockResolvedValue(mockAfes);
      (MockAfeDto.fromEntities as jest.Mock).mockReturnValue(mockDtos);

      // Act
      const result = await handler.execute(query);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
