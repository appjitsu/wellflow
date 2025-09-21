import { Module, Global } from '@nestjs/common';
import { LogRocketService } from './logrocket.service';

@Global()
@Module({
  providers: [LogRocketService],
  exports: [LogRocketService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class LogRocketModule {}
