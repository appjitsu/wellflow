import { ChainOfTitleEntry } from '../entities/chain-of-title-entry.entity';

export interface ChainOfTitleRepository {
  addEntry(entry: ChainOfTitleEntry): Promise<ChainOfTitleEntry>;
  findByLeaseId(
    leaseId: string,
    organizationId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<ChainOfTitleEntry[]>;
}
