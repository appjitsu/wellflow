import { JointOperatingAgreement } from '../entities/joint-operating-agreement.entity';

export interface IJoaRepository {
  save(entity: JointOperatingAgreement): Promise<JointOperatingAgreement>;
  findById(id: string): Promise<JointOperatingAgreement | null>;
  findByOrganizationId(
    organizationId: string,
    options?: {
      status?: 'ACTIVE' | 'TERMINATED' | 'SUSPENDED';
      limit?: number;
      offset?: number;
    },
  ): Promise<JointOperatingAgreement[]>;
}
