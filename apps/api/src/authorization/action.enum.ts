/**
 * Action enum for CASL permissions
 * Maps to the Actions type in abilities.factory.ts
 */
export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  UpdateStatus = 'updateStatus',
  SubmitReport = 'submitReport',
  ViewSensitive = 'viewSensitive',
  Export = 'export',
  Audit = 'audit',
  Submit = 'submit',
  Approve = 'approve',
  Reject = 'reject',
  // Regulatory-specific actions
  ApplyPermit = 'applyPermit',
  RenewPermit = 'renewPermit',
  RevokePermit = 'revokePermit',
  SuspendPermit = 'suspendPermit',
  ReportIncident = 'reportIncident',
  InvestigateIncident = 'investigateIncident',
  RespondIncident = 'respondIncident',
  CloseIncident = 'closeIncident',
  RecordMonitoring = 'recordMonitoring',
  GenerateReport = 'generateReport',
  ValidateReport = 'validateReport',
  SubmitRegulatoryReport = 'submitRegulatoryReport',
  ReviewReport = 'reviewReport',
  ScheduleCompliance = 'scheduleCompliance',
  OverrideCompliance = 'overrideCompliance',
  WaiveFee = 'waiveFee',
  EscalateIssue = 'escalateIssue',
}
