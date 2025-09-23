import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ValidationModule } from '../common/validation/validation.module';

@Module({
  imports: [DatabaseModule, RedisModule, AuthorizationModule, ValidationModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {
  // This module handles user management functionality
}
