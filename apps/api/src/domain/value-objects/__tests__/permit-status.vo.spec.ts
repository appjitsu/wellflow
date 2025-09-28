import { PermitStatus } from '../permit-status.vo';

describe('PermitStatus', () => {
  it('should be defined', () => {
    expect(PermitStatus.DRAFT).toBeDefined();
    expect(PermitStatus.APPROVED).toBeDefined();
  });

  it('should have correct values', () => {
    expect(PermitStatus.DRAFT.value).toBe('draft');
    expect(PermitStatus.APPROVED.value).toBe('approved');
  });

  it('should create from string', () => {
    const approved = PermitStatus.fromString('approved');
    expect(approved).toBe(PermitStatus.APPROVED);
  });

  it('should check active status', () => {
    expect(PermitStatus.APPROVED.isActive()).toBe(true);
    expect(PermitStatus.DENIED.isActive()).toBe(false);
  });

  it('should check terminal status', () => {
    expect(PermitStatus.EXPIRED.isTerminal()).toBe(true);
    expect(PermitStatus.APPROVED.isTerminal()).toBe(false);
  });
});
