import { IsOptional, IsUUID } from 'class-validator';

export class StudentPerformanceAnalyticsQueryDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
