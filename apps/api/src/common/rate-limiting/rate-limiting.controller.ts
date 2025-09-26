import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../presentation/guards/jwt-auth.guard';
import { AbilitiesGuard } from '../../authorization/abilities.guard';
import { CheckAbilities } from '../../authorization/abilities.decorator';
import { Action } from '../../authorization/action.enum';
import { EnhancedRateLimiterService, UserTier } from './enhanced-rate-limiter.service';

@ApiTags('Rate Limiting')
@ApiBearerAuth()
@Controller('rate-limiting')
@UseGuards(JwtAuthGuard, AbilitiesGuard)
export class RateLimitingController {
  constructor(private readonly rateLimiter: EnhancedRateLimiterService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get rate limiting configuration' })
  @ApiResponse({ status: 200, description: 'Rate limiting configuration' })
  @CheckAbilities({ action: Action.Read, subject: 'System' })
  getConfiguration() {
    return {
      tiers: this.rateLimiter.getAllTierConfigs(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status/:userId')
  @ApiOperation({ summary: 'Get rate limit status for a user' })
  @ApiResponse({ status: 200, description: 'User rate limit status' })
  @CheckAbilities({ action: Action.Read, subject: 'System' })
  async getUserStatus(
    @Param('userId') userId: string,
    @Body() body: { tier: UserTier },
  ) {
    const { tier } = body;
    const status = await this.rateLimiter.getUserStatus(userId, tier);

    return {
      userId,
      tier,
      ...status,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('reset/:userId')
  @ApiOperation({ summary: 'Reset rate limits for a user' })
  @ApiResponse({ status: 200, description: 'Rate limits reset successfully' })
  @CheckAbilities({ action: Action.Manage, subject: 'System' })
  async resetUserLimits(@Param('userId') userId: string) {
    await this.rateLimiter.resetUserLimits(userId);

    return {
      success: true,
      message: `Rate limits reset for user ${userId}`,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('config/update')
  @ApiOperation({ summary: 'Update rate limiting configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @CheckAbilities({ action: Action.Manage, subject: 'System' })
  updateConfiguration(@Body() updates: { tier: UserTier; config: any }) {
    const { tier, config } = updates;

    try {
      this.rateLimiter.updateTierConfig(tier, config);

      return {
        success: true,
        message: `Rate limiting configuration updated for tier ${tier}`,
        updatedConfig: this.rateLimiter.getTierConfig(tier),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to update configuration: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('blocked-requests/:userId')
  @ApiOperation({ summary: 'Get blocked requests for a user' })
  @ApiResponse({ status: 200, description: 'Blocked requests list' })
  @CheckAbilities({ action: Action.Read, subject: 'System' })
  async getBlockedRequests(@Param('userId') userId: string) {
    // This would need to be implemented in the service
    // For now, return placeholder
    return {
      userId,
      blockedRequests: [],
      message: 'Blocked requests tracking not yet implemented',
      timestamp: new Date().toISOString(),
    };
  }
}
