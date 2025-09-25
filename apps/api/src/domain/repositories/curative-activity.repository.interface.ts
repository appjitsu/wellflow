import { CurativeActivity } from '../entities/curative-activity.entity';

export interface CurativeActivityRepository {
  save(activity: CurativeActivity): Promise<CurativeActivity>;
  findByCurativeItemId(
    curativeItemId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<CurativeActivity[]>;
}
