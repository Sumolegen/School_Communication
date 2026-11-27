import { Module } from '@nestjs/common';
import { AuthModule } from '@core/auth/auth.module';
import { ApiV1Controller } from './v1/api-v1.controller';

@Module({
  imports: [AuthModule],
  controllers: [ApiV1Controller],
})
export class ApiModule {}
