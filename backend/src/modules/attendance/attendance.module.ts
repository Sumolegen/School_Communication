import { Module } from '@nestjs/common';
import { RecordsController } from './records/records.controller';
import { RecordsService } from './records/records.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';

@Module({
  controllers: [ReportsController, RecordsController],
  providers: [RecordsService, ReportsService],
  exports: [RecordsService, ReportsService],
})
export class AttendanceModule {}
