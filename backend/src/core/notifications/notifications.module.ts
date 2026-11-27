import { Global, Module } from '@nestjs/common';
import { CoreNotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [CoreNotificationsService],
  exports: [CoreNotificationsService],
})
export class CoreNotificationsModule {}
