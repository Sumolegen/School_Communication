import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { PriorityLevel } from '@shared/enums';

export class NotificationFeedQueryDto {
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
