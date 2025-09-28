import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepositoryImpl } from './infrastructure/users.repository';
import { DatabaseModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ValidationModule } from '../common/validation/validation.module';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '../database/schema';

@Module({
  imports: [DatabaseModule, RedisModule, AuthorizationModule, ValidationModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: 'UsersRepository',
      useClass: UsersRepositoryImpl,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {
  // This module handles user management functionality
}
