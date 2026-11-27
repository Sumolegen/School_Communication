import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAcademicUpdateDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  examTermId?: string;

  @IsString()
  title!: string;

  @IsString()
  summary!: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
