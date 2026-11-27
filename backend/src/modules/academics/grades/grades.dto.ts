import { IsArray, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GradeScaleDto {
  @IsString()
  gradeLabel!: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage!: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkGradeScaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeScaleDto)
  scales!: GradeScaleDto[];
}
