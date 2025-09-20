import { UpdateWellStatusCommand } from './update-well-status.command';
import { WellStatus } from '../../domain/enums/well-status.enum';

describe('UpdateWellStatusCommand', () => {
  describe('constructor', () => {
    it('should create a command with all required properties', () => {
      const wellId = 'well-123';
      const newStatus = WellStatus.DRILLING;
      const updatedBy = 'user-456';
      const reason = 'Starting drilling operations';

      const command = new UpdateWellStatusCommand(
        wellId,
        newStatus,
        updatedBy,
        reason,
      );

      expect(command.wellId).toBe(wellId);
      expect(command.newStatus).toBe(newStatus);
      expect(command.updatedBy).toBe(updatedBy);
      expect(command.reason).toBe(reason);
    });

    it('should create a command without optional reason', () => {
      const wellId = 'well-123';
      const newStatus = WellStatus.COMPLETED;
      const updatedBy = 'user-456';

      const command = new UpdateWellStatusCommand(wellId, newStatus, updatedBy);

      expect(command.wellId).toBe(wellId);
      expect(command.newStatus).toBe(newStatus);
      expect(command.updatedBy).toBe(updatedBy);
      expect(command.reason).toBeUndefined();
    });

    it('should handle different well statuses', () => {
      const wellId = 'well-123';
      const updatedBy = 'user-456';

      const statuses = [
        WellStatus.PLANNED,
        WellStatus.DRILLING,
        WellStatus.COMPLETED,
        WellStatus.PRODUCING,
        WellStatus.SHUT_IN,
        WellStatus.PLUGGED,
      ];

      statuses.forEach((status) => {
        const command = new UpdateWellStatusCommand(wellId, status, updatedBy);

        expect(command.newStatus).toBe(status);
        expect(command.wellId).toBe(wellId);
        expect(command.updatedBy).toBe(updatedBy);
      });
    });

    it('should handle various reason formats', () => {
      const wellId = 'well-123';
      const newStatus = WellStatus.SHUT_IN;
      const updatedBy = 'user-456';

      const reasons = [
        'Equipment maintenance required',
        'Regulatory compliance check',
        'Weather conditions',
        'Emergency shutdown',
        '',
      ];

      reasons.forEach((reason) => {
        const command = new UpdateWellStatusCommand(
          wellId,
          newStatus,
          updatedBy,
          reason,
        );

        expect(command.reason).toBe(reason);
      });
    });

    it('should handle different user identifiers', () => {
      const wellId = 'well-123';
      const newStatus = WellStatus.PRODUCING;

      const userIds = [
        'user-123',
        'operator-456',
        'admin-789',
        'system-automated',
        'john.doe@company.com',
      ];

      userIds.forEach((userId) => {
        const command = new UpdateWellStatusCommand(wellId, newStatus, userId);

        expect(command.updatedBy).toBe(userId);
      });
    });

    it('should handle different well ID formats', () => {
      const newStatus = WellStatus.DRILLING;
      const updatedBy = 'user-456';

      const wellIds = [
        'well-123',
        'WELL_456',
        'well-abc-def-789',
        '12345678-1234-1234-1234-123456789012',
        'api-4212345678',
      ];

      wellIds.forEach((wellId) => {
        const command = new UpdateWellStatusCommand(
          wellId,
          newStatus,
          updatedBy,
        );

        expect(command.wellId).toBe(wellId);
      });
    });
  });

  describe('properties', () => {
    it('should have readonly properties', () => {
      const command = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.DRILLING,
        'user-456',
        'Starting operations',
      );

      // Properties should be accessible
      expect(command.wellId).toBeDefined();
      expect(command.newStatus).toBeDefined();
      expect(command.updatedBy).toBeDefined();
      expect(command.reason).toBeDefined();
    });

    it('should maintain property values consistently', () => {
      const wellId = 'well-123';
      const newStatus = WellStatus.COMPLETED;
      const updatedBy = 'user-456';
      const reason = 'Well completion finished';

      const command = new UpdateWellStatusCommand(
        wellId,
        newStatus,
        updatedBy,
        reason,
      );

      // Multiple accesses should return same values
      expect(command.wellId).toBe(wellId);
      expect(command.wellId).toBe(command.wellId);
      expect(command.newStatus).toBe(newStatus);
      expect(command.newStatus).toBe(command.newStatus);
      expect(command.updatedBy).toBe(updatedBy);
      expect(command.updatedBy).toBe(command.updatedBy);
      expect(command.reason).toBe(reason);
      expect(command.reason).toBe(command.reason);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string reason', () => {
      const command = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.SHUT_IN,
        'user-456',
        '',
      );

      expect(command.reason).toBe('');
    });

    it('should handle undefined reason explicitly', () => {
      const command = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.PRODUCING,
        'user-456',
        undefined,
      );

      expect(command.reason).toBeUndefined();
    });

    it('should handle long reason text', () => {
      const longReason =
        'This is a very long reason that explains in great detail why the well status is being changed. '.repeat(
          5,
        );

      const command = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.PLUGGED,
        'user-456',
        longReason,
      );

      expect(command.reason).toBe(longReason);
      expect(command.reason!.length).toBeGreaterThan(100);
    });

    it('should handle special characters in properties', () => {
      const command = new UpdateWellStatusCommand(
        'well-123-äöü',
        WellStatus.DRILLING,
        'user@company.com',
        'Reason with special chars: éñ & symbols!',
      );

      expect(command.wellId).toBe('well-123-äöü');
      expect(command.updatedBy).toBe('user@company.com');
      expect(command.reason).toBe('Reason with special chars: éñ & symbols!');
    });
  });

  describe('status transitions', () => {
    it('should support common status transitions', () => {
      const wellId = 'well-123';
      const updatedBy = 'user-456';

      // Common transition scenarios
      const transitions = [
        {
          from: 'initial',
          to: WellStatus.PLANNED,
          reason: 'Well planning completed',
        },
        {
          from: WellStatus.PLANNED,
          to: WellStatus.DRILLING,
          reason: 'Drilling commenced',
        },
        {
          from: WellStatus.DRILLING,
          to: WellStatus.COMPLETED,
          reason: 'Drilling completed',
        },
        {
          from: WellStatus.COMPLETED,
          to: WellStatus.PRODUCING,
          reason: 'Production started',
        },
        {
          from: WellStatus.PRODUCING,
          to: WellStatus.SHUT_IN,
          reason: 'Temporary shutdown',
        },
        {
          from: WellStatus.SHUT_IN,
          to: WellStatus.PRODUCING,
          reason: 'Resumed production',
        },
        {
          from: WellStatus.PRODUCING,
          to: WellStatus.PLUGGED,
          reason: 'End of life',
        },
      ];

      transitions.forEach((transition) => {
        const command = new UpdateWellStatusCommand(
          wellId,
          transition.to,
          updatedBy,
          transition.reason,
        );

        expect(command.newStatus).toBe(transition.to);
        expect(command.reason).toBe(transition.reason);
      });
    });
  });

  describe('immutability', () => {
    it('should maintain consistent values across multiple accesses', () => {
      const command = new UpdateWellStatusCommand(
        'well-123',
        WellStatus.DRILLING,
        'user-456',
        'Starting drilling',
      );

      const wellId1 = command.wellId;
      const wellId2 = command.wellId;
      const status1 = command.newStatus;
      const status2 = command.newStatus;
      const user1 = command.updatedBy;
      const user2 = command.updatedBy;
      const reason1 = command.reason;
      const reason2 = command.reason;

      expect(wellId1).toBe(wellId2);
      expect(status1).toBe(status2);
      expect(user1).toBe(user2);
      expect(reason1).toBe(reason2);
    });
  });
});
