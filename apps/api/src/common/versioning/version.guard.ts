import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { VersionService } from './version.service';
import {
  API_VERSION_KEY,
  API_VERSION_DEPRECATION_KEY,
} from './api-version.decorator';

type RequestWithVersion = {
  apiVersion?: string;
  route?: { path: string };
  user?: { id: string };
};

@Injectable()
export class VersionGuard implements CanActivate {
  private readonly logger = new Logger(VersionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly versionService: VersionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const request = context.switchToHttp().getRequest() as RequestWithVersion;
    const handler = context.getHandler();

    // Get required version from metadata
    const requiredVersion = this.reflector.get<string>(
      API_VERSION_KEY,
      handler,
    );

    // Get deprecation info
    const deprecationInfo = this.reflector.get<{
      message?: string;
    }>(API_VERSION_DEPRECATION_KEY, handler);

    const requestedVersion = request.apiVersion || 'v1';
    const compatibility =
      this.versionService.checkCompatibility(requestedVersion);

    // Check if deprecated endpoint is being used
    if (deprecationInfo && requestedVersion === requiredVersion) {
      const message =
        deprecationInfo.message ||
        `API version ${requestedVersion} is deprecated for this endpoint`;

      this.logger.warn(`Deprecated API version used: ${message}`, {
        endpoint: request.route?.path,
        version: requestedVersion,
        userId: request.user?.id,
      });

      // You could throw an exception here to block deprecated versions
      // throw new ForbiddenException(message);
    }

    // Check version compatibility
    if (!compatibility.isCompatible) {
      throw new ForbiddenException(
        `API version ${requestedVersion} is not compatible. ${compatibility.warnings.join(' ')}`,
      );
    }

    // Check if specific version is required
    if (requiredVersion && requestedVersion !== requiredVersion) {
      throw new ForbiddenException(
        `This endpoint requires API version ${requiredVersion}, but ${requestedVersion} was requested.`,
      );
    }

    return true;
  }
}
