import { Test, TestingModule } from '@nestjs/testing';
import { GetPermitByIdHandler } from '../get-permit-by-id.handler';
import { GetPermitByIdQuery } from '../../queries/get-permit-by-id.query';
import { PermitRepository } from '../../../domain/repositories/permit.repository';
import { Permit } from '../../../domain/entities/permit.entity';
import { PermitType } from '../../../domain/value-objects/permit-type.vo';

describe('GetPermitByIdHandler', () => {
  let handler: GetPermitByIdHandler;
  let permitRepository: jest.Mocked<PermitRepository>;

  beforeEach(async () => {
    const mockPermitRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPermitByIdHandler,
        {
          provide: 'PermitRepository',
          useValue: mockPermitRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPermitByIdHandler>(GetPermitByIdHandler);
    permitRepository = module.get('PermitRepository');
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  describe('execute', () => {
    it('should return permit when found', async () => {
      const query = new GetPermitByIdQuery('permit-123');
      const mockPermit = new Permit(
        'permit-123',
        'PERMIT-001',
        PermitType.DRILLING,
        'org-456',
        'EPA',
        'user-789',
      );

      permitRepository.findById.mockResolvedValue(mockPermit);

      const result = await handler.execute(query);

      expect(permitRepository.findById).toHaveBeenCalledWith('permit-123');
      expect(result).toBe(mockPermit);
    });

    it('should return null when permit not found', async () => {
      const query = new GetPermitByIdQuery('non-existent');

      permitRepository.findById.mockResolvedValue(null);

      const result = await handler.execute(query);

      expect(permitRepository.findById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeNull();
    });
  });
});
