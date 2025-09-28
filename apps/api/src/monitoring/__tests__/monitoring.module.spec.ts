import { MonitoringModule } from '../monitoring.module';

describe('MonitoringModule', () => {
  it('should be defined', () => {
    expect(MonitoringModule).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(MonitoringModule).toBeInstanceOf(Function);
    expect(typeof MonitoringModule).toBe('function');
  });
});
