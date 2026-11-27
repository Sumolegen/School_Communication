import { IsOptional, IsUUID } from 'class-validator';

export class SubjectPerformanceQueryDto {
  @IsOptional()
  @IsUUID()
  sectionId?: string;
}
