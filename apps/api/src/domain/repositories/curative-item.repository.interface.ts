import { CurativeItem, CurativeStatus } from '../entities/curative-item.entity';

export interface CurativeItemRepository {
  save(item: CurativeItem, organizationId: string): Promise<CurativeItem>;
  findById(id: string, organizationId: string): Promise<CurativeItem | null>;
  findByTitleOpinionId(
    titleOpinionId: string,
    organizationId: string,
    options?: { limit?: number; offset?: number; status?: CurativeStatus },
  ): Promise<CurativeItem[]>;
}
