import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetAfeByIdHandler } from '../get-afe-by-id.handler';
import { GetAfeByIdQuery } from '../../queries/get-afe-by-id.query';
import { IAfeRepository } from '../../../domain/repositories/afe.repository.interface';
import { Afe } from '../../../domain/entities/afe.entity';
import { AfeNumber } from '../../../domain/value-objects/afe-number';
import { Money } from '../../../domain/value-objects/money';
import { AfeStatus, AfeType } from '../../../domain/enums/afe-status.enum';

describe('GetAfeByIdHandler', () => {
  let handler: GetAfeByIdHandler;
  let afeRepository: jest.Mocked<IAfeRepository>;

  beforeEach(async () => {
    const mockAfeRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAfeByIdHandler,
        {
          provide: 'AfeRepository',
          useValue: mockAfeRepository,
        },
      ],
    }).compile();

    handler = module.get<GetAfeByIdHandler>(GetAfeByIdHandler);
    afeRepository = module.get('AfeRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return AFE DTO when AFE is found', async () => {
      const query = new GetAfeByIdQuery('afe-123');

      const mockAfe = new Afe(
        'afe-123',
        'org-456',
        new AfeNumber('AFE-2024-001'),
        AfeType.DRILLING,
        {
          wellId: 'well-789',
          totalEstimatedCost: new Money(100000),
          description: 'Drilling operations for Well A',
          status: AfeStatus.APPROVED,
        },
      );

      // Manually set approvedAmount for testing (normally done through approve method)
      (mockAfe as any).approvedAmount = new Money(95000);

      afeRepository.findById.mockResolvedValue(mockAfe);

      const result = await handler.execute(query);

      expect(afeRepository.findById).toHaveBeenCalledWith('afe-123');
      expect(result).toEqual(
        expect.objectContaining({
          id: 'afe-123',
          organizationId: 'org-456',
          afeNumber: 'AFE-2024-0001',
          wellId: 'well-789',
          leaseId: undefined,
          afeType: AfeType.DRILLING,
          status: AfeStatus.APPROVED,
          totalEstimatedCost: { amount: 100000, currency: 'USD' },
          approvedAmount: { amount: 95000, currency: 'USD' },
          actualCost: undefined,
          effectiveDate: undefined,
          approvalDate: undefined,
          description: 'Drilling operations for Well A',
          version: 1,
        }),
      );
    });

    it('should return AFE DTO with minimal data when AFE has basic fields', async () => {
      const query = new GetAfeByIdQuery('afe-456');

      const mockAfe = new Afe(
        'afe-456',
        'org-789',
        new AfeNumber('AFE-2024-002'),
        AfeType.COMPLETION,
        {
          status: AfeStatus.DRAFT,
        },
      );

      afeRepository.findById.mockResolvedValue(mockAfe);

      const result = await handler.execute(query);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'afe-456',
          organizationId: 'org-789',
          afeNumber: 'AFE-2024-0002',
          wellId: undefined,
          leaseId: undefined,
          afeType: AfeType.COMPLETION,
          status: AfeStatus.DRAFT,
          totalEstimatedCost: undefined,
          approvedAmount: undefined,
          actualCost: undefined,
          effectiveDate: undefined,
          approvalDate: undefined,
          description: undefined,
          version: 1,
        }),
      );
    });

    it('should throw NotFoundException when AFE is not found', async () => {
      const query = new GetAfeByIdQuery('non-existent');

      afeRepository.findById.mockResolvedValue(null);

      await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
      expect(afeRepository.findById).toHaveBeenCalledWith('non-existent');
    });
  });
});
