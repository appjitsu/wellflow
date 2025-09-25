import { DrillingProgram } from '../entities/drilling-program.entity';
import { DrillingProgramStatus } from '../enums/drilling-program-status.enum';

export interface IDrillingProgramRepository {
  save(program: DrillingProgram): Promise<DrillingProgram>;
  findById(id: string): Promise<DrillingProgram | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      status?: DrillingProgramStatus;
      wellId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<DrillingProgram[]>;
  findByWellId(wellId: string): Promise<DrillingProgram[]>;
}
