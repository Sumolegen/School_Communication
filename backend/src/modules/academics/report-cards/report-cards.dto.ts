import { IsOptional, IsUUID } from 'class-validator';

export class ReportCardQueryDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  termId?: string;
}
