import { TitleOpinion, TitleStatus } from '../entities/title-opinion.entity';

export interface TitleOpinionRepository {
  save(opinion: TitleOpinion): Promise<TitleOpinion>;
  findById(id: string, organizationId: string): Promise<TitleOpinion | null>;
  findByLeaseId(
    leaseId: string,
    options?: { limit?: number; offset?: number; status?: TitleStatus },
  ): Promise<TitleOpinion[]>;
  findByOpinionNumber(
    organizationId: string,
    opinionNumber: string,
  ): Promise<TitleOpinion | null>;
}
