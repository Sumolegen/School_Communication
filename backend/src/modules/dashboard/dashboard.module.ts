import { Module } from '@nestjs/common';
import { AdminDashboardController } from './admin-dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard/admin-dashboard.service';
import { DashboardController } from './dashboard.controller';
import { StaffDashboardController } from './staff-dashboard/staff-dashboard.controller';
import { StaffDashboardService } from './staff-dashboard/staff-dashboard.service';
import { StudentDashboardController } from './student-dashboard/student-dashboard.controller';
import { StudentDashboardService } from './student-dashboard/student-dashboard.service';

@Module({
  controllers: [
    DashboardController,
    AdminDashboardController,
    StaffDashboardController,
    StudentDashboardController,
  ],
  providers: [AdminDashboardService, StaffDashboardService, StudentDashboardService],
  exports: [AdminDashboardService, StaffDashboardService, StudentDashboardService],
})
export class DashboardModule {}
