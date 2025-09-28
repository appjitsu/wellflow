import { PermitRenewalApprovedEvent } from '../permit-renewal-approved.event';

describe('PermitRenewalApprovedEvent', () => {
  let event: PermitRenewalApprovedEvent;

  beforeEach(() => {
    event = new PermitRenewalApprovedEvent(
      'permit-123',
      'user-123',
      new Date('2024-12-31'),
    );
  });

  it('should be defined', () => {
    expect(event).toBeDefined();
  });

  it('should store all constructor parameters', () => {
    expect(event.aggregateId).toBe('permit-123');
    expect(event.approvedByUserId).toBe('user-123');
    expect(event.newExpirationDate).toEqual(new Date('2024-12-31'));
  });
});
