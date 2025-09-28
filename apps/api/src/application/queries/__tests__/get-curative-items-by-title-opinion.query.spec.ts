import { GetCurativeItemsByTitleOpinionQuery } from '../get-curative-items-by-title-opinion.query';
import { CurativeStatus } from '../../../domain/entities/curative-item.entity';

describe('GetCurativeItemsByTitleOpinionQuery', () => {
  it('should create query with titleOpinionId, organizationId and default values', () => {
    const titleOpinionId = 'test-title-id';
    const organizationId = 'test-org-id';
    const query = new GetCurativeItemsByTitleOpinionQuery(
      titleOpinionId,
      organizationId,
    );
    expect(query.titleOpinionId).toBe(titleOpinionId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.status).toBeUndefined();
    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
  });

  it('should create query with status', () => {
    const titleOpinionId = 'test-title-id';
    const organizationId = 'test-org-id';
    const status = CurativeStatus.OPEN;
    const query = new GetCurativeItemsByTitleOpinionQuery(
      titleOpinionId,
      organizationId,
      status,
    );
    expect(query.titleOpinionId).toBe(titleOpinionId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.status).toBe(status);
  });

  it('should create query with custom page and limit', () => {
    const titleOpinionId = 'test-title-id';
    const organizationId = 'test-org-id';
    const page = 2;
    const limit = 10;
    const query = new GetCurativeItemsByTitleOpinionQuery(
      titleOpinionId,
      organizationId,
      undefined,
      page,
      limit,
    );
    expect(query.titleOpinionId).toBe(titleOpinionId);
    expect(query.organizationId).toBe(organizationId);
    expect(query.page).toBe(page);
    expect(query.limit).toBe(limit);
  });

  it('should be an instance of GetCurativeItemsByTitleOpinionQuery', () => {
    const query = new GetCurativeItemsByTitleOpinionQuery('title', 'org');
    expect(query).toBeInstanceOf(GetCurativeItemsByTitleOpinionQuery);
  });
});
