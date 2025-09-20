import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MigrationController],
  providers: [
    DatabaseService,
    MigrationService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (databaseService: DatabaseService) => databaseService.getDb(),
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, MigrationService, 'DATABASE_CONNECTION'],
})
export class DatabaseModule {}
