export enum IncidentType {
  SPILL = 'spill',
  LEAK = 'leak',
  EMISSION = 'emission',
  OTHER = 'other',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IncidentStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  REMEDIATION = 'remediation',
  CLOSED = 'closed',
}

export type VolumeUnit = 'barrels' | 'gallons' | 'cubic_feet';
