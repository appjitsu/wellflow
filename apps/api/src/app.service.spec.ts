import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('Service Configuration', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should be an instance of AppService', () => {
      expect(service).toBeInstanceOf(AppService);
    });
  });

  describe('getHello', () => {
    it('should return "Hello World!"', () => {
      const result = service.getHello();
      expect(result).toBe('Hello World!');
    });

    it('should return a string', () => {
      const result = service.getHello();
      expect(typeof result).toBe('string');
    });

    it('should be consistent across multiple calls', () => {
      const result1 = service.getHello();
      const result2 = service.getHello();
      expect(result1).toBe(result2);
    });
  });

  describe('Service Behavior', () => {
    it('should not throw errors when called', () => {
      expect(() => service.getHello()).not.toThrow();
    });

    it('should return non-empty string', () => {
      const result = service.getHello();
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Injectable Decorator', () => {
    it('should be decorated with @Injectable', () => {
      const metadata = Reflect.getMetadata('__injectable__', AppService);
      expect(metadata).toBe(true);
    });
  });

  describe('WellFlow API Health Check', () => {
    it('should serve as basic health check endpoint', () => {
      // This service method can be used for basic API health checks
      const result = service.getHello();
      expect(result).toBe('Hello World!');
    });

    it('should indicate API is responsive', () => {
      // A successful call indicates the API is running and responsive
      expect(() => service.getHello()).not.toThrow();
      expect(service.getHello()).toBeDefined();
    });
  });
});
