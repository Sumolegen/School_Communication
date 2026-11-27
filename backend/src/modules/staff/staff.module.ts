import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments/assignments.controller';
import { AssignmentsService } from './assignments/assignments.service';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  controllers: [AssignmentsController, StaffController],
  providers: [AssignmentsService, StaffService],
  exports: [AssignmentsService, StaffService],
})
export class StaffModule {}
