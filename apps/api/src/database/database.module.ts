import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: (databaseService: DatabaseService) => databaseService.getDb(),
      inject: [DatabaseService],
    },
  ],
  exports: [DatabaseService, 'DATABASE_CONNECTION'],
})
export class DatabaseModule {}
