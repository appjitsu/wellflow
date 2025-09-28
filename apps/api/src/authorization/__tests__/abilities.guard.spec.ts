import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilitiesGuard } from '../abilities.guard';
import { AbilitiesFactory, User } from '../abilities.factory';
import { CHECK_ABILITIES_KEY, RequiredRule } from '../abilities.decorator';
import { it } from '@jest/globals';

describe('AbilitiesGuard', () => {
  let guard: AbilitiesGuard;
  let reflector: jest.Mocked<Reflector>;
  let abilitiesFactory: jest.Mocked<AbilitiesFactory>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;

  beforeEach(async () => {
    const mockReflector = {
      get: jest.fn(),
    };

    const mockAbilitiesFactory = {
      createForUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbilitiesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AbilitiesFactory,
          useValue: mockAbilitiesFactory,
        },
      ],
    }).compile();

    guard = module.get<AbilitiesGuard>(AbilitiesGuard);
    reflector = module.get(Reflector);
    abilitiesFactory = module.get(AbilitiesFactory);

    mockExecutionContext = {
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as any;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when no abilities are required', () => {
      reflector.get.mockReturnValue([]);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.get).toHaveBeenCalledWith(
        CHECK_ABILITIES_KEY,
        mockExecutionContext.getHandler(),
      );
    });

    it('should return true when abilities array is undefined', () => {
      reflector.get.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      const rules: RequiredRule[] = [{ action: 'read', subject: 'Well' }];
      reflector.get.mockReturnValue(rules);

      const mockRequest = {
        user: undefined,
      };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'User not authenticated',
      );
    });

    it('should return true when user has required ability', () => {
      const rules: RequiredRule[] = [{ action: 'read', subject: 'Well' }];
      reflector.get.mockReturnValue(rules);

      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['operator'],
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const mockAbility = {
        can: jest.fn().mockReturnValue(true),
      };
      abilitiesFactory.createForUser.mockReturnValue(mockAbility as any);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(abilitiesFactory.createForUser).toHaveBeenCalledWith(user);
      expect(mockAbility.can).toHaveBeenCalledWith('read', 'Well');
    });

    it('should throw ForbiddenException when user lacks required ability', () => {
      const rules: RequiredRule[] = [{ action: 'update', subject: 'Well' }];
      reflector.get.mockReturnValue(rules);

      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['viewer'],
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const mockAbility = {
        can: jest.fn().mockReturnValue(false),
      };
      abilitiesFactory.createForUser.mockReturnValue(mockAbility as any);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Access denied. Cannot update Well',
      );
    });

    it('should check all required rules and return true when all pass', () => {
      const rules: RequiredRule[] = [
        { action: 'read', subject: 'Well' },
        { action: 'create', subject: 'Well' },
      ];
      reflector.get.mockReturnValue(rules);

      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['operator'],
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const mockAbility = {
        can: jest
          .fn()
          .mockReturnValueOnce(true) // First rule passes
          .mockReturnValueOnce(true), // Second rule passes
      };
      abilitiesFactory.createForUser.mockReturnValue(mockAbility as any);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockAbility.can).toHaveBeenCalledTimes(2);
      expect(mockAbility.can).toHaveBeenNthCalledWith(1, 'read', 'Well');
      expect(mockAbility.can).toHaveBeenNthCalledWith(2, 'create', 'Well');
    });

    it('should throw ForbiddenException on first failed rule when multiple rules exist', () => {
      const rules: RequiredRule[] = [
        { action: 'read', subject: 'Well' },
        { action: 'delete', subject: 'Well' },
      ];
      reflector.get.mockReturnValue(rules);

      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['operator'],
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const mockAbility = {
        can: jest
          .fn()
          .mockReturnValueOnce(true) // First rule passes
          .mockReturnValueOnce(false), // Second rule fails
      };
      abilitiesFactory.createForUser.mockReturnValue(mockAbility as any);

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        'Access denied. Cannot delete Well',
      );
      expect(mockAbility.can).toHaveBeenCalledTimes(2);
    });

    it('should handle different subject types', () => {
      const rules: RequiredRule[] = [
        { action: 'manage', subject: 'Well' },
        { action: 'read', subject: 'all' },
      ];
      reflector.get.mockReturnValue(rules);

      const user: User = {
        id: 'user-1',
        email: 'user@example.com',
        roles: ['admin'],
      };

      const mockRequest = { user };
      (
        mockExecutionContext.switchToHttp()
          .getRequest as jest.MockedFunction<any>
      ).mockReturnValue(mockRequest);

      const mockAbility = {
        can: jest.fn().mockReturnValue(true),
      };
      abilitiesFactory.createForUser.mockReturnValue(mockAbility as any);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockAbility.can).toHaveBeenCalledWith('manage', 'Well');
      expect(mockAbility.can).toHaveBeenCalledWith('read', 'all');
    });
  });
});
