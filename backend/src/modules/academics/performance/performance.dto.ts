import { IsOptional, IsUUID } from 'class-validator';

export class PerformanceQueryDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;
}
