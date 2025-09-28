import { IncidentsModule } from '../incidents.module';

describe('IncidentsModule', () => {
  it('should be defined', () => {
    expect(IncidentsModule).toBeDefined();
  });

  it('should be a class', () => {
    expect(typeof IncidentsModule).toBe('function');
  });

  it('should have a prototype', () => {
    expect(IncidentsModule.prototype).toBeDefined();
  });

  it('should be importable without errors', () => {
    expect(() => IncidentsModule).not.toThrow();
  });
});
