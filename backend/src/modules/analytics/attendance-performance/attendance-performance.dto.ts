import { IsOptional, IsString } from 'class-validator';

export class AttendancePerformanceQueryDto {
  @IsOptional()
  @IsString()
  month?: string;
}
