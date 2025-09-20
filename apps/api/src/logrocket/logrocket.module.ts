import { Module, Global } from '@nestjs/common';
import { LogRocketService } from './logrocket.service';

@Global()
@Module({
  providers: [LogRocketService],
  exports: [LogRocketService],
})
export class LogRocketModule {}
