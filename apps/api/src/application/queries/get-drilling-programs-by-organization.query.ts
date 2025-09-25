import { DrillingProgramStatus } from '../../domain/enums/drilling-program-status.enum';

export class GetDrillingProgramsByOrganizationQuery {
  constructor(
    public readonly organizationId: string,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: {
      status?: DrillingProgramStatus;
      wellId?: string;
    },
  ) {}
}
