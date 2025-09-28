import { MemoryCacheService } from '../memory-cache.service';

describe('MemoryCacheService', () => {
  let service: MemoryCacheService;

  beforeEach(() => {
    service = new MemoryCacheService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get values', async () => {
    await service.set('test-key', 'test-value');
    const value = await service.get<string>('test-key');
    expect(value).toBe('test-value');
  });

  it('should return null for non-existent keys', async () => {
    const value = await service.get<string>('non-existent');
    expect(value).toBeNull();
  });

  it('should delete values', async () => {
    await service.set('test-key', 'test-value');
    const deleted = await service.delete('test-key');
    expect(deleted).toBe(true);
    const value = await service.get<string>('test-key');
    expect(value).toBeNull();
  });
});
