import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisService],
  exports: [RedisService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class RedisModule {}
