import { IsOptional, IsUUID } from 'class-validator';

export class AttendanceReportQueryDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @IsOptional()
  month?: string;
}
