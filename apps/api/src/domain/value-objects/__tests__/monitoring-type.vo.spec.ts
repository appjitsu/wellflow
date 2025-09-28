import { MonitoringType } from '../monitoring-type.vo';

describe('MonitoringType', () => {
  it('should create a valid monitoring type', () => {
    const type = MonitoringType.AIR;
    expect(type).toBeDefined();
    expect(type.toString()).toBe('air');
  });

  it('should create type from string', () => {
    const type = MonitoringType.fromString('water');
    expect(type).toBe(MonitoringType.WATER);
  });
});
