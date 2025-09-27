import { Test, TestingModule } from '@nestjs/testing';
import { PermitRepositoryImpl } from '../permit.repository';
import { Permit } from '../../../domain/entities/permit.entity';
import { PermitType } from '../../../domain/value-objects/permit-type.vo';
import { PermitStatus } from '../../../domain/value-objects/permit-status.vo';

describe('PermitRepositoryImpl', () => {
  let repository: PermitRepositoryImpl;
  let mockDb: any;

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermitRepositoryImpl,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<PermitRepositoryImpl>(PermitRepositoryImpl);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return permit when found', async () => {
      const mockPermitData = {
        id: 'permit-123',
        permitNumber: 'PERMIT-001',
        permitType: 'drilling',
        status: 'draft',
        organizationId: 'org-123',
        issuingAgency: 'EPA',
        createdByUserId: 'user-456',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.execute.mockResolvedValue([mockPermitData]);

      const result = await repository.findById('permit-123');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Permit);
      expect(result?.id).toBe('permit-123');
    });

    it('should return null when not found', async () => {
      mockDb.execute.mockResolvedValue([]);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save a permit', async () => {
      const permit = Permit.create(
        'PERMIT-001',
        PermitType.DRILLING,
        'org-123',
        'EPA',
        'user-456',
      );

      mockDb.execute.mockResolvedValue(undefined);

      await expect(repository.save(permit)).resolves.toBeUndefined();

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
    });
  });
});
