import { IsBoolean, IsEnum, IsString } from 'class-validator';
import { RoleCode } from '@shared/enums';

export class UpsertSchoolPermissionOverrideDto {
  @IsEnum(RoleCode)
  roleCode!: RoleCode;

  @IsString()
  permissionCode!: string;

  @IsBoolean()
  granted!: boolean;
}
