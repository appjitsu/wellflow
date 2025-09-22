import { BaseRepository } from '../base.repository';
import { organizations } from '../../../database/schema';

// Create a test repository class that bypasses NestJS dependency injection
class TestRepository extends BaseRepository<typeof organizations> {
  constructor(db: unknown) {
    // Bypass the @Inject decorator by calling the parent constructor directly
    super(db as never, organizations);
  }
}

describe('BaseRepository - Simple Tests', () => {
  let repository: TestRepository;
  let mockDb: {
    insert: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(() => {
    // Simple mock database that returns resolved promises
    mockDb = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ id: 'test-id', name: 'Test Org' }]),
        }),
      }),
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest
              .fn()
              .mockResolvedValue([{ id: 'test-id', name: 'Test Org' }]),
          }),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest
              .fn()
              .mockResolvedValue([{ id: 'test-id', name: 'Updated Org' }]),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'test-id' }]),
        }),
      }),
    };

    // Create repository instance without NestJS dependency injection
    repository = new TestRepository(mockDb);
  });

  describe('create', () => {
    it('should create a new record', async () => {
      const data = { name: 'Test Organization' };
      const result = await repository.create(data);

      expect(mockDb.insert).toHaveBeenCalledWith(organizations);
      expect(result).toEqual({ id: 'test-id', name: 'Test Org' });
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      const result = await repository.findById('test-id');

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual({ id: 'test-id', name: 'Test Org' });
    });

    it('should return null if record not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update record by ID', async () => {
      const updateData = { name: 'Updated Organization' };
      const result = await repository.update('test-id', updateData);

      expect(mockDb.update).toHaveBeenCalledWith(organizations);
      expect(result).toEqual({ id: 'test-id', name: 'Updated Org' });
    });
  });

  describe('delete', () => {
    it('should delete record by ID', async () => {
      const result = await repository.delete('test-id');

      expect(mockDb.delete).toHaveBeenCalledWith(organizations);
      expect(result).toBe(true);
    });
  });

  describe('exists', () => {
    it('should return true if record exists', async () => {
      const result = await repository.exists('test-id');
      expect(result).toBe(true);
    });
  });
});
