import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';

@Module({
  controllers: [MonitoringController],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MonitoringModule {}
