import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';

export class CreateDrillingProgramCommand {
  constructor(
    public readonly organizationId: string,
    public readonly wellId: string,
    public readonly programName: string,
    public readonly options?: {
      afeId?: string;
      status?: DrillingProgramStatus;
      version?: number;
      program?: Record<string, unknown>;
      hazards?: Record<string, unknown>;
      approvals?: Array<Record<string, unknown>>;
    },
  ) {}
}
