import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRepository } from './organization.repository';

describe('OrganizationRepository', () => {
  let repository: OrganizationRepository;
  let mockDb: any;

  beforeEach(async () => {
    // Create a mock database with chainable methods
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      returning: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationRepository,
        {
          provide: 'DATABASE_CONNECTION',
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get<OrganizationRepository>(OrganizationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByName', () => {
    it('should find organization by name', async () => {
      const mockOrg = { id: '1', name: 'Test Org', email: 'test@example.com' };
      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await repository.findByName('Test Org');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrg);
    });

    it('should return null when organization not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByName('Nonexistent Org');

      expect(result).toBeNull();
    });

    it('should handle case-insensitive search', async () => {
      const mockOrg = { id: '1', name: 'Test Org', email: 'test@example.com' };
      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await repository.findByName('test org');

      expect(result).toEqual(mockOrg);
    });
  });

  describe('findByTaxId', () => {
    it('should find organization by tax ID', async () => {
      const mockOrg = { id: '1', name: 'Test Org', taxId: '123456789' };
      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await repository.findByTaxId('123456789');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrg);
    });

    it('should return null when tax ID not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByTaxId('999999999');

      expect(result).toBeNull();
    });

    it('should handle empty tax ID', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByTaxId('');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find organization by email', async () => {
      const mockOrg = { id: '1', name: 'Test Org', email: 'test@example.com' };
      mockDb.limit.mockResolvedValue([mockOrg]);

      const result = await repository.findByEmail('test@example.com');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockOrg);
    });

    it('should return null when email not found', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle invalid email format', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await repository.findByEmail('invalid-email');

      expect(result).toBeNull();
    });
  });

  describe('search', () => {
    it('should search organizations by query', async () => {
      const mockOrgs = [
        { id: '1', name: 'Test Org 1', email: 'test1@example.com' },
        { id: '2', name: 'Test Org 2', email: 'test2@example.com' },
      ];
      mockDb.where.mockResolvedValue(mockOrgs);

      const result = await repository.search('test');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockOrgs);
    });

    it('should return empty array when no matches found', async () => {
      mockDb.where.mockResolvedValue([]);

      const result = await repository.search('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle empty search query', async () => {
      const mockOrgs = [
        { id: '1', name: 'Test Org', email: 'test@example.com' },
      ];
      mockDb.where.mockResolvedValue(mockOrgs);

      const result = await repository.search('');

      expect(result).toEqual(mockOrgs);
    });
  });

  describe('updateSettings', () => {
    it('should update organization settings', async () => {
      const mockOrg = {
        id: '1',
        name: 'Test Org',
        settings: { theme: 'dark' },
      };
      mockDb.returning.mockResolvedValue([mockOrg]);

      const settings = { theme: 'dark', notifications: true };
      const result = await repository.updateSettings('1', settings);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith({
        settings,
        updatedAt: expect.any(Date),
      });
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
      expect(result).toEqual(mockOrg);
    });

    it('should return null when organization not found for update', async () => {
      mockDb.returning.mockResolvedValue([]);

      const result = await repository.updateSettings('999', { theme: 'light' });

      expect(result).toBeNull();
    });

    it('should handle empty settings object', async () => {
      const mockOrg = { id: '1', name: 'Test Org', settings: {} };
      mockDb.returning.mockResolvedValue([mockOrg]);

      const result = await repository.updateSettings('1', {});

      expect(result).toEqual(mockOrg);
    });
  });

  describe('getStatistics', () => {
    it('should return organization statistics', async () => {
      const result = await repository.getStatistics('1');

      expect(result).toEqual({
        totalUsers: 0,
        totalWells: 0,
        totalLeases: 0,
        totalProduction: 0,
      });
    });

    it('should return consistent statistics structure', async () => {
      const result1 = await repository.getStatistics('1');
      const result2 = await repository.getStatistics('2');

      expect(result1).toEqual(result2);
      expect(typeof result1.totalUsers).toBe('number');
      expect(typeof result1.totalWells).toBe('number');
      expect(typeof result1.totalLeases).toBe('number');
      expect(typeof result1.totalProduction).toBe('number');
    });

    it('should handle different organization IDs', async () => {
      const result1 = await repository.getStatistics('org-1');
      const result2 = await repository.getStatistics('org-2');
      const result3 = await repository.getStatistics('');

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDb.limit.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.findByName('Test')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle null/undefined inputs', async () => {
      mockDb.limit.mockResolvedValue([]);

      const result1 = await repository.findByName(null as any);
      const result2 = await repository.findByEmail(undefined as any);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('repository instantiation', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });

    it('should be an instance of OrganizationRepository', () => {
      expect(repository).toBeInstanceOf(OrganizationRepository);
    });

    it('should have all required methods', () => {
      expect(typeof repository.findByName).toBe('function');
      expect(typeof repository.findByTaxId).toBe('function');
      expect(typeof repository.findByEmail).toBe('function');
      expect(typeof repository.search).toBe('function');
      expect(typeof repository.updateSettings).toBe('function');
      expect(typeof repository.getStatistics).toBe('function');
    });
  });
});
