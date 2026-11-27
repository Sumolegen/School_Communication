import { Module } from '@nestjs/common';
import { AttendancePerformanceController } from './attendance-performance/attendance-performance.controller';
import { AttendancePerformanceService } from './attendance-performance/attendance-performance.service';
import { ClassPerformanceController } from './class-performance/class-performance.controller';
import { ClassPerformanceService } from './class-performance/class-performance.service';
import { StudentPerformanceController } from './student-performance/student-performance.controller';
import { StudentPerformanceService } from './student-performance/student-performance.service';
import { SubjectPerformanceController } from './subject-performance/subject-performance.controller';
import { SubjectPerformanceService } from './subject-performance/subject-performance.service';

@Module({
  controllers: [
    StudentPerformanceController,
    SubjectPerformanceController,
    ClassPerformanceController,
    AttendancePerformanceController,
  ],
  providers: [
    StudentPerformanceService,
    SubjectPerformanceService,
    ClassPerformanceService,
    AttendancePerformanceService,
  ],
  exports: [
    StudentPerformanceService,
    SubjectPerformanceService,
    ClassPerformanceService,
    AttendancePerformanceService,
  ],
})
export class AnalyticsModule {}
