import { Test, TestingModule } from '@nestjs/testing';
import { CreatePermitHandler } from '../create-permit.handler';
import { CreatePermitCommand } from '../../commands/create-permit.command';
import { PermitRepository } from '../../../domain/repositories/permit.repository';
import { Permit } from '../../../domain/entities/permit.entity';

describe('CreatePermitHandler', () => {
  let handler: CreatePermitHandler;
  let permitRepository: jest.Mocked<PermitRepository>;

  beforeEach(async () => {
    const mockPermitRepository = {
      findByPermitNumber: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermitHandler,
        {
          provide: 'PermitRepository',
          useValue: mockPermitRepository,
        },
      ],
    }).compile();

    handler = module.get<CreatePermitHandler>(CreatePermitHandler);
    permitRepository = module.get('PermitRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should create a permit successfully', async () => {
      const command = new CreatePermitCommand(
        'PERMIT-001',
        'drilling',
        'org-123',
        'EPA',
        'user-456',
        'well-789',
        'State Authority',
        new Date('2023-01-01'),
        new Date('2024-01-01'),
        { condition: 'test' },
        { requirement: 'test' },
        1000,
        5000,
        'surety',
        'Location A',
        'facility-123',
        ['doc-1', 'doc-2'],
      );

      permitRepository.findByPermitNumber.mockResolvedValue(null);
      permitRepository.save.mockResolvedValue(undefined);

      const result = await handler.execute(command);

      expect(permitRepository.findByPermitNumber).toHaveBeenCalledWith(
        'PERMIT-001',
      );
      expect(permitRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          permitNumber: 'PERMIT-001',
          permitType: expect.objectContaining({ value: 'drilling' }),
          organizationId: 'org-123',
          issuingAgency: 'EPA',
          createdByUserId: 'user-456',
          wellId: 'well-789',
          regulatoryAuthority: 'State Authority',
          applicationDate: new Date('2023-01-01'),
          expirationDate: new Date('2024-01-01'),
          permitConditions: { condition: 'test' },
          complianceRequirements: { requirement: 'test' },
          feeAmount: 1000,
          bondAmount: 5000,
          bondType: 'surety',
          location: 'Location A',
          facilityId: 'facility-123',
          documentIds: ['doc-1', 'doc-2'],
        }),
      );
      expect(typeof result).toBe('string');
    });

    it('should throw error if permit number already exists', async () => {
      const command = new CreatePermitCommand(
        'PERMIT-001',
        'drilling',
        'org-123',
        'EPA',
        'user-456',
      );

      const existingPermit = {} as Permit;
      permitRepository.findByPermitNumber.mockResolvedValue(existingPermit);

      await expect(handler.execute(command)).rejects.toThrow(
        'Permit number PERMIT-001 already exists',
      );
      expect(permitRepository.findByPermitNumber).toHaveBeenCalledWith(
        'PERMIT-001',
      );
      expect(permitRepository.save).not.toHaveBeenCalled();
    });

    it('should create permit with minimal required fields', async () => {
      const command = new CreatePermitCommand(
        'PERMIT-002',
        'completion',
        'org-456',
        'State',
        'user-789',
      );

      permitRepository.findByPermitNumber.mockResolvedValue(null);
      permitRepository.save.mockResolvedValue(undefined);

      await handler.execute(command);

      expect(permitRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          permitNumber: 'PERMIT-002',
          permitType: expect.objectContaining({ value: 'completion' }),
          wellId: undefined,
          regulatoryAuthority: undefined,
        }),
      );
    });
  });
});
