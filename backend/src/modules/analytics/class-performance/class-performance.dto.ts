import { IsOptional, IsUUID } from 'class-validator';

export class ClassPerformanceQueryDto {
  @IsOptional()
  @IsUUID()
  examTermId?: string;
}
