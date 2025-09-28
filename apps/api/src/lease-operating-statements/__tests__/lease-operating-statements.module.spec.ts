import { LeaseOperatingStatementsModule } from '../lease-operating-statements.module';

describe('LeaseOperatingStatementsModule', () => {
  it('should be defined', () => {
    expect(LeaseOperatingStatementsModule).toBeDefined();
  });

  it('should be a valid NestJS module', () => {
    expect(LeaseOperatingStatementsModule).toBeInstanceOf(Function);
    expect(typeof LeaseOperatingStatementsModule).toBe('function');
  });
});
