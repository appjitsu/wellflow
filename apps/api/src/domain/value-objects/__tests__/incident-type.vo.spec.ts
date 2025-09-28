import { IncidentType } from '../incident-type.vo';

describe('IncidentType', () => {
  it('should be defined', () => {
    expect(IncidentType.SPILL).toBeDefined();
    expect(IncidentType.INJURY).toBeDefined();
  });

  it('should have correct values', () => {
    expect(IncidentType.SPILL.value).toBe('spill');
    expect(IncidentType.INJURY.value).toBe('injury');
  });

  it('should create from string', () => {
    const spill = IncidentType.fromString('spill');
    expect(spill).toBe(IncidentType.SPILL);
  });

  it('should identify safety critical incidents', () => {
    expect(IncidentType.FATALITY.isSafetyCritical()).toBe(true);
    expect(IncidentType.NEAR_MISS.isSafetyCritical()).toBe(false);
  });
});
