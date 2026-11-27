import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RoleCode } from '@shared/enums';

export class RoleFilterDto {
  @IsOptional()
  @IsEnum(RoleCode)
  code?: RoleCode;

  @IsOptional()
  @IsString()
  search?: string;
}
