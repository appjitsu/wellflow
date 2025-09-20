import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilitiesFactory, Actions, User } from './abilities.factory';
import { CHECK_ABILITIES_KEY, RequiredRule } from './abilities.decorator';

/**
 * CASL Abilities Guard
 * Enforces fine-grained permissions using CASL
 */
@Injectable()
export class AbilitiesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilitiesFactory: AbilitiesFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules =
      this.reflector.get<RequiredRule[]>(
        CHECK_ABILITIES_KEY,
        context.getHandler(),
      ) || [];

    if (rules.length === 0) {
      return true; // No abilities required
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const ability = this.abilitiesFactory.createForUser(user);

    // Check all required rules
    for (const rule of rules) {
      const isAllowed = ability.can(rule.action, rule.subject);

      if (!isAllowed) {
        throw new ForbiddenException(
          `Access denied. Cannot ${rule.action} ${rule.subject}`,
        );
      }
    }

    return true;
  }
}
