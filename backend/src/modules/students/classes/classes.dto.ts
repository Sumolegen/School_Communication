import { IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateClassDto {
  @IsString()
  @MaxLength(60)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class CreateSectionDto {
  @IsUUID()
  classId!: string;

  @IsOptional()
  @IsUUID()
  academicYearId?: string;

  @IsString()
  @MaxLength(30)
  name!: string;

  @IsOptional()
  @IsUUID()
  classTeacherId?: string;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @IsUUID()
  classTeacherId?: string | null;
}
